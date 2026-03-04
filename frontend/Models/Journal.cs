namespace TravelMind.API.Models
{
    public class Journal
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? TripId { get; set; }
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public DateTime? Date { get; set; }
    }
}
