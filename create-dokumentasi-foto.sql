CREATE TABLE IF NOT EXISTS "dokumentasi_foto" (
  "id"              SERIAL PRIMARY KEY,
  "organisasi_type" TEXT NOT NULL,
  "judul"           VARCHAR(150) NOT NULL,
  "deskripsi"       TEXT,
  "image_url"       VARCHAR(255) NOT NULL,
  "public_id"       VARCHAR(100),
  "tanggal"         DATE NOT NULL,
  "created_by"      INTEGER NOT NULL REFERENCES "users"("id"),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "dokumentasi_foto_organisasi_type_idx" ON "dokumentasi_foto"("organisasi_type");
CREATE INDEX IF NOT EXISTS "dokumentasi_foto_tanggal_idx" ON "dokumentasi_foto"("tanggal");
CREATE INDEX IF NOT EXISTS "dokumentasi_foto_created_at_idx" ON "dokumentasi_foto"("created_at");
