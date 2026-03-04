using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using TravelMind.API.Data;
using TravelMind.API.Models;
using TravelMind.API.Services;

namespace TravelMind.API.Controllers;

[ApiController, Route("api/trips"), Authorize]
public class TripsController : ControllerBase
{
    private readonly DatabaseHelper _db;
    private readonly JwtService _jwt;
    public TripsController(DatabaseHelper db, JwtService jwt) { _db = db; _jwt = jwt; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        int uid = _jwt.GetUserId(User);
        var dt = await _db.ExecuteQueryAsync(
            "SELECT * FROM Trips WHERE UserId=@uid ORDER BY StartDate DESC",
            [new SqlParameter("@uid", uid)]);
        return Ok(dt.AsEnumerable().Select(r => new {
            id = (int)r["Id"],
            name = r["Name"],
            destination = r["Destination"],
            startDate = r["StartDate"] == DBNull.Value ? null : (DateTime?)r["StartDate"],
            endDate = r["EndDate"] == DBNull.Value ? null : (DateTime?)r["EndDate"],
            notes = r["Notes"] == DBNull.Value ? null : r["Notes"].ToString()
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        int uid = _jwt.GetUserId(User);
        var dt = await _db.ExecuteQueryAsync(
            "SELECT * FROM Trips WHERE Id=@id AND UserId=@uid",
            [new("@id", id), new("@uid", uid)]);
        if (dt.Rows.Count == 0) return NotFound();
        var r = dt.Rows[0];
        return Ok(new
        {
            id = (int)r["Id"],
            name = r["Name"],
            destination = r["Destination"],
            startDate = r["StartDate"] == DBNull.Value ? null : (DateTime?)r["StartDate"],
            endDate = r["EndDate"] == DBNull.Value ? null : (DateTime?)r["EndDate"],
            notes = r["Notes"] == DBNull.Value ? null : r["Notes"].ToString()
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TripDto dto)
    {
        int uid = _jwt.GetUserId(User);
        var newId = await _db.ExecuteScalarAsync(
            @"INSERT INTO Trips (UserId, Name, Destination, StartDate, EndDate, Notes)
              OUTPUT INSERTED.Id
              VALUES (@uid, @name, @dest, @start, @end, @notes)",
            [new("@uid", uid), new("@name", dto.Name), new("@dest", dto.Destination),
             new("@start", (object?)dto.StartDate ?? DBNull.Value),
             new("@end", (object?)dto.EndDate ?? DBNull.Value),
             new("@notes", (object?)dto.Notes ?? DBNull.Value)]);
        return CreatedAtAction(nameof(Get), new { id = newId }, new { id = newId, dto.Name, dto.Destination });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TripDto dto)
    {
        int uid = _jwt.GetUserId(User);
        var rows = await _db.ExecuteNonQueryAsync(
            @"UPDATE Trips SET Name=@name, Destination=@dest, StartDate=@start, EndDate=@end, Notes=@notes
              WHERE Id=@id AND UserId=@uid",
            [new("@name", dto.Name), new("@dest", dto.Destination),
             new("@start", (object?)dto.StartDate ?? DBNull.Value),
             new("@end", (object?)dto.EndDate ?? DBNull.Value),
             new("@notes", (object?)dto.Notes ?? DBNull.Value),
             new("@id", id), new("@uid", uid)]);
        return rows == 0 ? NotFound() : NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        int uid = _jwt.GetUserId(User);
        await _db.ExecuteNonQueryAsync("DELETE FROM Trips WHERE Id=@id AND UserId=@uid",
            [new("@id", id), new("@uid", uid)]);
        return NoContent();
    }
}

