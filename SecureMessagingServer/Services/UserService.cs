using System.Security.Cryptography;
using System.Text;
using SecureMessagingServer.Models;

namespace SecureMessagingServer.Services
{
    public class UserService : IUserService
    {
        private readonly List<User> _users = new();

        public UserService()
        {
            // Add some default users for testing
            // Should be removed if we decide to use a database
            RegisterUser("alice", "password123");
            RegisterUser("bob", "password123");
        }

        public bool ValidateCredentials(string username, string password)
        {
            var user = _users.FirstOrDefault(u => u.Username == username);
            if (user == null)
            {
                return false;
            }

            var hashedPassword = HashPassword(password, user.Salt);
            return hashedPassword == user.PasswordHash;
        }

        public bool RegisterUser(string username, string password)
        {
            if (_users.Any(u => u.Username == username))
            {
                return false;
            }

            var salt = GenerateSalt();
            
            var passwordHash = HashPassword(password, salt);

            var user = new User
            {
                Username = username,
                PasswordHash = passwordHash,
                Salt = salt
            };

            _users.Add(user);
            return true;
        }

        public User? GetUserByUsername(string username)
        {
            return _users.FirstOrDefault(u => u.Username == username);
        }

        public IEnumerable<string> GetAllUsernames()
        {
            return _users.Select(u => u.Username);
        }

        private static string GenerateSalt()
        {
            var saltBytes = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(saltBytes);
            }
            return Convert.ToBase64String(saltBytes);
        }

        private static string HashPassword(string password, string salt)
        {
            var combinedBytes = Encoding.UTF8.GetBytes(password + salt);
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(combinedBytes);
            
            return Convert.ToBase64String(hashBytes);
        }
    }
} 