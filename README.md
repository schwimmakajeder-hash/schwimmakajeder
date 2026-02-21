# Schwimmakajeder - Kursverwaltung

Professionelle Plattform zur Verwaltung von Schwimmkursen, Teilnehmern und Trainern.

## Features
- Kursverwaltung & Terminplanung
- Trainer-Dashboard & Kalender
- Tauschanfragen für Trainer
- Teilnehmerlisten & PDF-Export
- Automatische E-Mail-Erinnerungen
- Supabase Integration

## Installation & Deployment

### 1. Datenbank (Supabase)
Führe das SQL-Skript (siehe unten) im Supabase SQL Editor aus, um die Tabellen zu erstellen.

### 2. Umgebungsvariablen
Erstelle eine `.env` Datei oder setze die Variablen in Vercel:
- `VITE_SUPABASE_URL`: Deine Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Dein Supabase Anon Key

### 3. Lokal starten
```bash
npm install
npm run dev
```

## SQL Setup
Führe diesen Code im Supabase SQL Editor aus:

```sql
-- 1. Tabelle für Kursleiter/Trainer
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'LEADER', 'INSTRUCTOR')),
    category TEXT NOT NULL CHECK (category IN ('Schwimmlehrer:in', 'Helfer:in')),
    is_admin BOOLEAN DEFAULT false,
    wage_per_unit NUMERIC DEFAULT 0,
    wage_per_unit_7 NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabelle für Kurse
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    course_number TEXT,
    location TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    notes TEXT,
    color TEXT,
    category TEXT,
    required_instructors INTEGER DEFAULT 1,
    required_helpers INTEGER DEFAULT 1,
    pool_rent NUMERIC DEFAULT 0,
    billed_date DATE,
    leader_id UUID REFERENCES instructors(id),
    attendance_list_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabelle für Teilnehmer
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date_of_birth DATE,
    phone TEXT,
    email TEXT,
    guardian_name TEXT,
    paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabelle für Termine (Sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    is_replacement BOOLEAN DEFAULT false,
    is_5er BOOLEAN DEFAULT false,
    is_7er BOOLEAN DEFAULT false,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Verknüpfungstabelle für Trainer pro Termin (Many-to-Many)
CREATE TABLE session_instructors (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, instructor_id)
);

-- Beispiel-Admin anlegen (Passwort: OliTsc)
INSERT INTO instructors (name, email, password, role, category, is_admin, wage_per_unit, wage_per_unit_7)
VALUES ('Oliver Tschabrun', 'oliver@swim.de', 'OliTsc', 'INSTRUCTOR', 'Schwimmlehrer:in', true, 35, 45);
```
