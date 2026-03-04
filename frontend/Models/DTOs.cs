namespace TravelMind.API.Models
{
        public record LoginDto(string Email, string Password);
        public record RegisterDto(string Name, string Email, string Password);
        public record TripDto(string Name, string Destination, DateTime? StartDate, DateTime? EndDate, string? Notes);
        public record ExpenseDto(string Description, decimal Amount, string? Category, int? TripId, DateTime? Date);
        public record JournalDto(string Title, string Content, int? TripId, DateTime? Date);
}
