using Microsoft.Data.SqlClient;
using System.Data;
namespace TravelMind.API.Data
{
    public class DatabaseHelper
    {
        private readonly string _connectionString;

        public DatabaseHelper(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        public SqlConnection GetConnection() => new SqlConnection(_connectionString);

        public async Task<DataTable> ExecuteQueryAsync(string sql, SqlParameter[]? parameters = null)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            if (parameters != null) cmd.Parameters.AddRange(parameters);
            var dt = new DataTable();
            using var reader = await cmd.ExecuteReaderAsync();
            dt.Load(reader);
            return dt;
        }

        public async Task<int> ExecuteNonQueryAsync(string sql, SqlParameter[]? parameters = null)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            if (parameters != null) cmd.Parameters.AddRange(parameters);
            return await cmd.ExecuteNonQueryAsync();
        }

        public async Task<object?> ExecuteScalarAsync(string sql, SqlParameter[]? parameters = null)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            if (parameters != null) cmd.Parameters.AddRange(parameters);
            return await cmd.ExecuteScalarAsync();
        }
    }
}
