-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 08, 2025 at 03:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dtr_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `employeeid` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `employeeid`, `username`, `password`, `token`, `expires_at`) VALUES
(38, 1478, 'Ceas', '$2y$10$WZJmo3ij49qH/ENhzeEhiuw9Wy6uzeGQ85YfDn/msObowEC5jZ.6y', '6a96831aec853428cd55ea3777fe747129c6dc681495150ceb32f81df6e06ba9', '2025-06-09 20:28:22'),
(39, 1111, 'test', '$2y$10$UAPZmAKjsfrpMYNXNThcOu51tSVHlQ5o2seuIX17d3T0pPTIV9P0q', 'da281454304a31f15bac23257b6dad1cc3b360519378e7fe9822792fca8af872', '2025-06-09 20:48:46'),
(40, 1999, 'apt', '$2y$10$oASmN9Lnd4Sw9obZc2G6tOXqTw/Xp3Lz9SSdghBmtX29DkC9rXvFq', '16b308a3241e8862d1c23972b0721cee92e4105e2a7eb47d196c567d25c5e08c', '2025-06-09 20:47:55'),
(44, 199, 'jokeaside', '$2y$10$oBABhjOyC8.s.o93cfFBmOfYqszoxaw13Pad9TGco9aIlNxNJR02G', 'e7ca0a5e79b0765a8f8796148770c96ad75caab1b3e96168a747db82d77a084a', NULL),
(45, 2025, 'portal', '$2y$10$v1xjrAbLoDsQtRk1NNVpnu0FZskdvSEdPh9dkKhNEOdo46UYwQdo2', '42e999dd936311ec6f75a5606b39f4edf1391cf976590c823f3d6c065dc5cc18', NULL),
(46, 1417, 'chicken', '$2y$10$AlEEe2LIxXYPu0MX0VCUTO2WGoZjblDWA8nbvQCyr3hdJRIVzsoRi', '29808e2ad76a6b89a037c8f3f2028f89241dd0003e84d4c5b2a69056f4cd1812', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dtr`
--

CREATE TABLE `dtr` (
  `id` int(11) NOT NULL,
  `employeeid` int(11) NOT NULL,
  `timein` datetime DEFAULT NULL,
  `timeout` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dtr`
--

INSERT INTO `dtr` (`id`, `employeeid`, `timein`, `timeout`) VALUES
(92, 199, '2025-06-08 12:27:31', '2025-06-08 12:27:41'),
(93, 1478, '2025-06-08 04:28:00', '2025-06-07 16:29:00'),
(94, 2025, '2025-06-01 04:30:00', '2025-06-08 04:30:00'),
(95, 1999, '2025-06-08 12:47:55', '2025-06-08 12:48:09'),
(96, 1111, '2025-06-08 12:48:46', NULL),
(97, 1417, '2025-06-08 12:50:12', '2025-06-08 12:50:24');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `employeeid` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employeeid`, `firstname`, `lastname`) VALUES
(65, 1478, 'Physicals', 'Education'),
(66, 1111, 'Toyota', 'Corolla'),
(67, 1999, 'Lambor', 'Ghini'),
(71, 199, 'John', 'doe'),
(72, 2025, 'Computer', 'Science'),
(73, 1417, 'Jhan', 'Loyd');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employeeid->employees` (`employeeid`);

--
-- Indexes for table `dtr`
--
ALTER TABLE `dtr`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DTR->EMPLOYEE` (`employeeid`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employeeid` (`employeeid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `dtr`
--
ALTER TABLE `dtr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `employeeid->employees` FOREIGN KEY (`employeeid`) REFERENCES `employees` (`employeeid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dtr`
--
ALTER TABLE `dtr`
  ADD CONSTRAINT `DTR->EMPLOYEE` FOREIGN KEY (`employeeid`) REFERENCES `employees` (`employeeid`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
