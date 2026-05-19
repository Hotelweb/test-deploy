variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Name prefix for AWS resources."
  type        = string
  default     = "a25-test"
}

variable "admin_ssh_cidr" {
  description = "CIDR allowed to SSH to the EC2 instance. Use your public IP with /32."
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to the public SSH key Terraform will register in EC2."
  type        = string
  default     = "~/.ssh/a25_aws.pub"
}

variable "instance_type" {
  description = "EC2 instance type. t3.micro is normally Free Tier eligible for older accounts."
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class. db.t3.micro/db.t4g.micro are normally Free Tier eligible where available."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "Initial Postgres database name."
  type        = string
  default     = "a25_db"
}

variable "db_username" {
  description = "Postgres master username."
  type        = string
  default     = "a25admin"
}
