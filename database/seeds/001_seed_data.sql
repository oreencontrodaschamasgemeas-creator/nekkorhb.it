-- Seed Roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system access'),
('Security Manager', 'Manages guards, incidents, and devices'),
('Guard', 'Physical security personnel'),
('Resident', 'Building resident'),
('Maintenance', 'Maintenance personnel')
ON CONFLICT (name) DO NOTHING;

-- Retrieve role IDs for subsequent inserts (using CTEs or just assumption of order if fresh DB, but let's be safe and use DO block or subqueries in real app. For seed file, I will use subqueries)

-- Seed Permissions
INSERT INTO permissions (name, description) VALUES
('users.manage', 'Create, update, delete users'),
('roles.manage', 'Create, update, delete roles'),
('devices.view', 'View device status and feeds'),
('devices.manage', 'Configure devices'),
('incidents.view', 'View incidents'),
('incidents.manage', 'Create and update incidents'),
('reports.view', 'View analytical reports')
ON CONFLICT (name) DO NOTHING;

-- Assign Permissions to Roles
-- Admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Security Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Security Manager' AND p.name IN ('devices.view', 'devices.manage', 'incidents.view', 'incidents.manage', 'reports.view', 'users.manage')
ON CONFLICT DO NOTHING;

-- Guard
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Guard' AND p.name IN ('devices.view', 'incidents.view', 'incidents.manage')
ON CONFLICT DO NOTHING;

-- Seed Admin User (password: admin123 - hashed placeholder)
INSERT INTO users (username, email, password_hash, full_name, role_id, status)
SELECT 'admin', 'admin@secure.system', '$2b$10$EpIq/sOqD/F.g/h.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z', 'System Administrator', id, 'active'
FROM roles WHERE name = 'Admin'
ON CONFLICT (username) DO NOTHING;

-- Seed System Configuration
INSERT INTO system_configurations (key, value, description) VALUES
('site_name', '"SecureComplex Alpha"', 'Name of the facility'),
('retention_policy_days', '90', 'Default data retention in days'),
('alert_email', '"alerts@secure.system"', 'Email for critical alerts')
ON CONFLICT (key) DO NOTHING;

-- Seed a few devices
INSERT INTO devices (name, type, location, status) VALUES
('Main Gate Camera', 'camera', 'Main Gate', 'online'),
('Lobby Sensor', 'sensor', 'Lobby', 'online'),
('Back Door Controller', 'access_controller', 'Back Door', 'online');
