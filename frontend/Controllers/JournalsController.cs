using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using TravelMind.API.Data;
using TravelMind.API.Models;
using TravelMind.API.Services;

namespace TravelMind.API.Controllers;

[ApiController, Route("api/journals"), Authorize]
public class JournalsController : ControllerBase
{
    private readonly DatabaseHelper _db;
    private readonly JwtService _jwt;
    public JournalsController(DatabaseHelper db, JwtService jwt) { _db = db; _jwt = jwt; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        int uid = _jwt.GetUserId(User);
        var dt = await _db.ExecuteQueryAsync(
            "SELECT * FROM Journals WHERE UserId=@uid ORDER BY Date DESC",
            [new SqlParameter("@uid", uid)]);
        return Ok(dt.AsEnumerable().Select(r => new {
            id = (int)r["Id"],
            title = r["Title"].ToString(),
            content = r["Content"].ToString(),
            tripId = r["TripId"] == DBNull.Value ? (int?)null : (int)r["TripId"],
            date = r["Date"] == DBNull.Value ? null : (DateTime?)r["Date"]
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JournalDto dto)
    {
        int uid = _jwt.GetUserId(User);
        var newId = await _db.ExecuteScalarAsync(
            @"INSERT INTO Journals (UserId, Title, Content, TripId, Date)
              OUTPUT INSERTED.Id VALUES (@uid,@title,@content,@tid,@date)",
            [new("@uid", uid), new("@title", dto.Title), new("@content", dto.Content),
             new("@tid", (object?)dto.TripId ?? DBNull.Value),
             new("@date", (object?)dto.Date ?? DBNull.Value)]);
        return Created("", new { id = newId });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        int uid = _jwt.GetUserId(User);
        await _db.ExecuteNonQueryAsync("DELETE FROM Journals WHERE Id=@id AND UserId=@uid",
            [new("@id", id), new("@uid", uid)]);
        return NoContent();
    }
}
