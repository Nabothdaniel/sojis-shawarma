<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Core\Database;
use BamzySMS\Middleware\AuthMiddleware;
use PDO;

class BackupController extends Controller {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Trigger a full database backup.
     * Generates a SQL file with DROP, CREATE, and INSERT statements for all tables.
     */
    public function generate() {
        // Security: Ensure only admins can trigger this via API if needed
        // For a direct script call, we'll assume internal access or check a secret
        
        try {
            $sql = $this->getFullDump();
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $backupDir = __DIR__ . '/../../storage/backups';

            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $path = $backupDir . '/' . $filename;
            file_put_contents($path, $sql);

            return $this->json([
                'status' => 'success',
                'message' => 'Backup generated successfully.',
                'file' => $filename,
                'path' => '/storage/backups/' . $filename
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'status' => 'error',
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Internal logic to perform a full SQL dump.
     */
    private function getFullDump() {
        $output = "-- BamzySMS Database Dump\n";
        $output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
        $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        // Get all tables
        $tables = [];
        $stmt = $this->db->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        foreach ($tables as $table) {
            $output .= "-- Table structure for table `$table` --\n";
            $output .= "DROP TABLE IF EXISTS `$table`;\n";
            
            $stmt = $this->db->query("SHOW CREATE TABLE `$table`");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $output .= $row['Create Table'] . ";\n\n";

            $output .= "-- Data for table `$table` --\n";
            $stmt = $this->db->query("SELECT * FROM `$table`");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $keys = array_keys($row);
                $values = array_map(function($val) {
                    if ($val === null) return "NULL";
                    return $this->db->quote($val);
                }, array_values($row));

                $output .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $values) . ");\n";
            }
            $output .= "\n\n";
        }

        $output .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $output;
    }
}
