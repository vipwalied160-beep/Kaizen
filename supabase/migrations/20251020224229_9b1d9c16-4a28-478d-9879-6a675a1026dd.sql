-- Add indexes for better performance with large datasets
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_registered_at ON attendance_records(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_session_id ON device_fingerprints(session_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON attendance_sessions(is_active, ends_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_professor ON attendance_sessions(professor_id, created_at DESC);

-- Add composite index for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_attendance_unique_check ON attendance_records(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_device_unique_check ON device_fingerprints(session_id, fingerprint_hash);