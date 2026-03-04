using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using TravelMind.API.Data;
using TravelMind.API.Models;
using TravelMind.API.Services;
using BCrypt.Net;

namespace TravelMind.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly DatabaseHelper _db;
    private readonly JwtService _jwt;

    public AuthController(DatabaseHelper db, JwtService jwt)
    {
        _db = db; _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var exists = await _db.ExecuteScalarAsync(
            "SELECT COUNT(1) FROM Users WHERE Email = @email",
            [new SqlParameter("@email", dto.Email)]);

        if (Convert.ToInt32(exists) > 0)
            return BadRequest(new { message = "Email already registered." });

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var newId = await _db.ExecuteScalarAsync(
            "INSERT INTO Users (Name, Email, PasswordHash) OUTPUT INSERTED.Id VALUES (@name, @email, @hash)",
            [new("@name", dto.Name), new("@email", dto.Email), new("@hash", hash)]);

        var user = new User { Id = Convert.ToInt32(newId), Name = dto.Name, Email = dto.Email };
        return Ok(new { token = _jwt.GenerateToken(user), user = new { user.Id, user.Name, user.Email } });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var dt = await _db.ExecuteQueryAsync(
            "SELECT Id, Name, Email, PasswordHash FROM Users WHERE Email = @email",
            [new SqlParameter("@email", dto.Email)]);

        if (dt.Rows.Count == 0) return Unauthorized(new { message = "Invalid credentials." });

        var row = dt.Rows[0];
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, row["PasswordHash"].ToString()))
            return Unauthorized(new { message = "Invalid credentials." });

        var user = new User
        {
            Id = (int)row["Id"],
            Name = row["Name"].ToString()!,
            Email = row["Email"].ToString()!
        };
        return Ok(new { token = _jwt.GenerateToken(user), user = new { user.Id, user.Name, user.Email } });
    }
}