"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePatient, useUploadPatientPhoto } from "@/hooks/use-patients";
import { formatDate, calculateAge } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle, Spinner, Badge } from "@/components/ui";
import { EncounterHistory } from "@/components/encounters/encounter-history";
import { AdmissionForm } from "@/components/encounters/admission-form";
import { InsuranceCard } from "@/components/patients/insurance-card";
import { ContactCard } from "@/components/patients/contact-card";
import { ProviderCard } from "@/components/patients/provider-card";
import { User } from "lucide-react";
import { ApiError } from "@/lib/api-client";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadImageFromObjectUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    image.src = url;
  });
}

async function buildCroppedSquareFile(
  file: File,
  zoom: number,
  panX: number,
  panY: number,
  outputSizePx = 1024,
): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;

    const cropSide = Math.max(32, Math.min(sourceWidth, sourceHeight) / zoom);
    const centerX = sourceWidth / 2;
    const centerY = sourceHeight / 2;
    const maxOffsetX = (sourceWidth - cropSide) / 2;
    const maxOffsetY = (sourceHeight - cropSide) / 2;

    const sourceX = clamp(centerX - cropSide / 2 + (panX / 100) * maxOffsetX, 0, sourceWidth - cropSide);
    const sourceY = clamp(centerY - cropSide / 2 + (panY / 100) * maxOffsetY, 0, sourceHeight - cropSide);

    const canvas = document.createElement("canvas");
    canvas.width = outputSizePx;
    canvas.height = outputSizePx;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas-Kontext konnte nicht erstellt werden.");
    }

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      cropSide,
      cropSide,
      0,
      0,
      outputSizePx,
      outputSizePx,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) {
          reject(new Error("Bild konnte nicht verarbeitet werden."));
          return;
        }
        resolve(b);
      }, "image/jpeg", 0.92);
    });

    const filename = file.name.replace(/\.[^.]+$/, "") || "patient-photo";
    return new File([blob], `${filename}-crop.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

export default function PersonalienPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, isError } = usePatient(patientId);
  const uploadPhoto = useUploadPatientPhoto(patientId);
  const [showAdmission, setShowAdmission] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPanX, setCropPanX] = useState(0);
  const [cropPanY, setCropPanY] = useState(0);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [patient?.photo_url]);

  useEffect(() => {
    return () => {
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl]);

  const resetCropEditor = () => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropFile(null);
    setCropPreviewUrl(null);
    setCropZoom(1);
    setCropPanX(0);
    setCropPanY(0);
  };

  const onPhotoSelected = (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Ungültiges Format. Bitte JPG, PNG oder WEBP wählen.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Datei zu gross. Maximal 5 MB erlaubt.");
      return;
    }

    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }

    setCropFile(file);
    setCropPreviewUrl(URL.createObjectURL(file));
    setCropZoom(1);
    setCropPanX(0);
    setCropPanY(0);
  };

  const onApplyCropAndUpload = async () => {
    if (!cropFile) return;

    setPhotoError(null);

    try {
      const cropped = await buildCroppedSquareFile(cropFile, cropZoom, cropPanX, cropPanY);
      uploadPhoto.mutate(cropped, {
        onSuccess: () => {
          resetCropEditor();
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            setPhotoError(err.message);
            return;
          }
          setPhotoError("Upload fehlgeschlagen. Bitte erneut versuchen.");
        },
      });
    } catch {
      setPhotoError("Bild konnte nicht verarbeitet werden.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-red-600 py-8 text-center">
            Patientendaten konnten nicht geladen werden.
          </p>
        </CardContent>
      </Card>
    );
  }

  const genderLabel =
    patient.gender === "male" ? "Männlich" :
      patient.gender === "female" ? "Weiblich" : patient.gender;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Nachname" value={patient.last_name} />
          <InfoRow label="Vorname" value={patient.first_name} />
          <InfoRow label="Geburtsdatum" value={formatDate(patient.date_of_birth)} />
          <InfoRow label="Alter" value={`${calculateAge(patient.date_of_birth)} Jahre`} />
          <InfoRow label="Geschlecht" value={genderLabel} />
          <InfoRow label="AHV-Nr." value={patient.ahv_number} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <Badge
              variant={
                patient.status === "active" ? "success" :
                  patient.status === "discharged" ? "default" : "danger"
              }
            >
              {patient.status === "active" ? "Aktiv" :
                patient.status === "discharged" ? "Entlassen" : "Verstorben"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {patient.photo_url && !photoLoadFailed ? (
                <img
                  src={patient.photo_url}
                  alt={`Patientenbild ${patient.first_name} ${patient.last_name}`}
                  className="w-32 h-40 rounded-lg border border-slate-300 object-cover bg-slate-50"
                  onError={() => {
                    setPhotoLoadFailed(true);
                    setPhotoError((prev) => prev ?? "Patientenbild konnte nicht geladen werden.");
                  }}
                />
              ) : (
                <div className="w-32 h-40 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                    <User className="w-7 h-7" />
                  </div>
                  <span className="mt-1.5 text-sm font-semibold text-slate-600">
                    {`${patient.first_name?.[0] ?? ""}${patient.last_name?.[0] ?? ""}`.toUpperCase() || "ID"}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1 text-center">Patientenbild</p>
              <label className="mt-1 inline-flex w-full justify-center px-2 py-1 text-[11px] rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors">
                {uploadPhoto.isPending ? "Lädt…" : "Foto wählen"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadPhoto.isPending}
                  onChange={(event) => {
                    onPhotoSelected(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1 text-center">JPG, PNG oder WEBP · max. 5 MB</p>
              {photoError && <p className="text-[10px] text-red-600 mt-1 text-center">{photoError}</p>}

              {cropPreviewUrl && (
                <div className="mt-2 w-52 rounded-lg border border-slate-200 bg-white p-2 space-y-2">
                  <p className="text-[11px] font-medium text-slate-700">Ausschnitt-Vorschau</p>

                  <div className="w-44 h-44 mx-auto rounded-md overflow-hidden border border-slate-200 bg-slate-100 relative">
                    <img
                      src={cropPreviewUrl}
                      alt="Crop-Vorschau"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        transform: `scale(${cropZoom}) translate(${cropPanX}%, ${cropPanY}%)`,
                        transformOrigin: "center",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={cropZoom}
                      onChange={(e) => setCropZoom(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Horizontal</label>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      step={1}
                      value={cropPanX}
                      onChange={(e) => setCropPanX(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Vertikal</label>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      step={1}
                      value={cropPanY}
                      onChange={(e) => setCropPanY(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={onApplyCropAndUpload}
                      disabled={uploadPhoto.isPending}
                      className="flex-1 px-2 py-1 text-[11px] rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Übernehmen
                    </button>
                    <button
                      type="button"
                      onClick={resetCropEditor}
                      disabled={uploadPhoto.isPending}
                      className="flex-1 px-2 py-1 text-[11px] rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <InfoRow label="Patienten-ID" value={patient.id} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aufenthaltshistorie */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aufenthalte (Encounters)</CardTitle>
            <button
              onClick={() => setShowAdmission((v) => !v)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {showAdmission ? "Abbrechen" : "+ Aufnahme"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {showAdmission && (
            <div className="mb-6">
              <AdmissionForm
                patientId={patientId}
                onSuccess={() => setShowAdmission(false)}
                onCancel={() => setShowAdmission(false)}
              />
            </div>
          )}
          <EncounterHistory patientId={patientId} />
        </CardContent>
      </Card>

      {/* Versicherungen */}
      <Card className="lg:col-span-2">
        <CardContent>
          <InsuranceCard patientId={patientId} />
        </CardContent>
      </Card>

      {/* Kontaktpersonen */}
      <Card>
        <CardContent>
          <ContactCard patientId={patientId} />
        </CardContent>
      </Card>

      {/* Medizinische Zuweiser */}
      <Card>
        <CardContent>
          <ProviderCard patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}
