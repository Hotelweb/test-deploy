output "app_url" {
  description = "Public URL for testers."
  value       = "http://${aws_instance.app.public_ip}"
}

output "app_public_ip" {
  description = "EC2 public IP for GitHub Actions SERVER_HOST."
  value       = aws_instance.app.public_ip
}

output "ssh_user" {
  description = "EC2 SSH username."
  value       = "ubuntu"
}

output "db_host" {
  description = "RDS endpoint host for GitHub Actions DB_HOST."
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

output "db_name" {
  value = aws_db_instance.postgres.db_name
}

output "db_username" {
  value = aws_db_instance.postgres.username
}

output "db_password" {
  description = "RDS password. Store this in GitHub secret DB_PASSWORD."
  value       = random_password.db.result
  sensitive   = true
}
