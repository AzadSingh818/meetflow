"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
} from "lucide-react";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type DocType =
  | "resume"
  | "cover_letter"
  | "report"
  | "other";

interface UploadState {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

export default function FileUploader() {
  const { data: session } = useSession();

  const qc = useQueryClient();

  const addToast = useAppStore(
    (s) => s.addToast,
  );

  const [dragging, setDragging] =
    useState(false);

  const [uploads, setUploads] = useState<
    UploadState[]
  >([]);

  const [docType, setDocType] =
    useState<DocType>("resume");

  // ─────────────────────────────────────────────
  // Update upload item
  // ─────────────────────────────────────────────
  const updateUpload = (
    idx: number,
    patch: Partial<UploadState>,
  ) => {
    setUploads((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, ...patch }
          : item,
      ),
    );
  };

  // ─────────────────────────────────────────────
  // Upload file to Cloudinary
  // ─────────────────────────────────────────────
  const uploadFile = async (
    file: File,
    idx: number,
    selectedType: DocType,
  ) => {
    try {
      if (!session?.user?.id) {
        throw new Error(
          "Please login first",
        );
      }

      // Validate type
      if (
        !ALLOWED_TYPES.includes(file.type)
      ) {
        updateUpload(idx, {
          status: "error",
          error: "File type not allowed",
        });

        return;
      }

      // Validate size
      if (file.size > MAX_SIZE) {
        updateUpload(idx, {
          status: "error",
          error:
            "File exceeds 10MB limit",
        });

        return;
      }

      // DEBUG
      console.log("Uploading:", {
        name: file.name,
        type: selectedType,
      });

      // Create FormData
      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "upload_preset",
        process.env
          .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      formData.append(
        "folder",
        `documents/${session.user.id}`,
      );

      // Create XHR
      const xhr =
        new XMLHttpRequest();

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${
          process.env
            .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        }/auto/upload`,
      );

      // Upload progress
      xhr.upload.addEventListener(
        "progress",
        (event) => {
          if (
            event.lengthComputable
          ) {
            const progress =
              Math.round(
                (event.loaded /
                  event.total) *
                  100,
              );

            updateUpload(idx, {
              progress,
            });
          }
        },
      );

      // Upload complete
      xhr.onload = async () => {
        try {
          if (
            xhr.status !== 200
          ) {
            console.error(
              xhr.responseText,
            );

            throw new Error(
              "Cloudinary upload failed",
            );
          }

          const cloudinaryData =
            JSON.parse(
              xhr.responseText,
            );

          console.log(
            "Cloudinary:",
            cloudinaryData,
          );

          // Save in MongoDB
          const res = await fetch(
            "/api/documents",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                name: file.name,
                type: selectedType,
                url: cloudinaryData.secure_url,
                storagePath:
                  cloudinaryData.public_id,
                size: file.size,
                mimeType: file.type,
              }),
            },
          );

          const data =
            await res.json();

          if (!res.ok) {
            console.error(data);

            throw new Error(
              data.error ||
                "Failed to save document",
            );
          }

          updateUpload(idx, {
            status: "done",
            progress: 100,
          });

          qc.invalidateQueries({
            queryKey: ["documents"],
          });

          addToast({
            type: "success",
            title:
              "File uploaded",
            message: file.name,
          });
        } catch (err) {
          console.error(err);

          updateUpload(idx, {
            status: "error",
            error:
              err instanceof Error
                ? err.message
                : "Upload failed",
          });

          addToast({
            type: "error",
            title:
              "Upload failed",
            message:
              err instanceof Error
                ? err.message
                : "Upload failed",
          });
        }
      };

      // Upload error
      xhr.onerror = () => {
        updateUpload(idx, {
          status: "error",
          error: "Network error",
        });

        addToast({
          type: "error",
          title: "Upload failed",
          message:
            "Network error",
        });
      };

      // Send request
      xhr.send(formData);
    } catch (err) {
      console.error(err);

      updateUpload(idx, {
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "Upload failed",
      });

      addToast({
        type: "error",
        title: "Upload failed",
        message:
          err instanceof Error
            ? err.message
            : "Upload failed",
      });
    }
  };

  // ─────────────────────────────────────────────
  // Handle selected files
  // ─────────────────────────────────────────────
  const handleFiles = useCallback(
    (
      files: FileList | null,
    ) => {
      if (!files?.length) return;

      const arr =
        Array.from(files);

      const startIdx =
        uploads.length;

      setUploads((prev) => [
        ...prev,
        ...arr.map((file) => ({
          file,
          progress: 0,
          status:
            "uploading" as const,
        })),
      ]);

      arr.forEach((file, i) =>
        uploadFile(
          file,
          startIdx + i,
          docType,
        ),
      );
    },
    [
      uploads.length,
      docType,
      session,
    ],
  );

  // ─────────────────────────────────────────────
  // Drop handler
  // ─────────────────────────────────────────────
  const onDrop = (
    e: React.DragEvent,
  ) => {
    e.preventDefault();

    setDragging(false);

    handleFiles(
      e.dataTransfer.files,
    );
  };

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            "resume",
            "cover_letter",
            "report",
            "other",
          ] as DocType[]
        ).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              setDocType(type)
            }
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all capitalize
            ${
              docType === type
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
            }`}
          >
            {type.replace(
              "_",
              " ",
            )}
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() =>
          setDragging(false)
        }
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-12 px-6 cursor-pointer transition-all
        ${
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
        }`}
      >
        <input
          type="file"
          className="sr-only"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) =>
            handleFiles(
              e.target.files,
            )
          }
        />

        <div
          className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
          ${
            dragging
              ? "bg-blue-100"
              : "bg-white border border-gray-200"
          }`}
        >
          <Upload
            className={`h-6 w-6
            ${
              dragging
                ? "text-blue-600"
                : "text-gray-400"
            }`}
          />
        </div>

        <p className="text-sm font-semibold text-gray-900">
          {dragging
            ? "Drop files here"
            : "Drag & drop files here"}
        </p>

        <p className="text-xs text-gray-400 mt-1">
          or click to browse
        </p>

        <p className="text-xs text-gray-300 mt-3">
          PDF, Word, PNG,
          JPG · Max 10 MB
        </p>
      </label>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(
            (upload, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border
                ${
                  upload.status ===
                  "error"
                    ? "bg-red-50 border-red-200"
                    : upload.status ===
                        "done"
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-100"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${
                    upload.status ===
                    "error"
                      ? "bg-red-100"
                      : upload.status ===
                          "done"
                        ? "bg-green-100"
                        : "bg-blue-50"
                  }`}
                >
                  <FileText
                    className={`h-4 w-4
                    ${
                      upload.status ===
                      "error"
                        ? "text-red-500"
                        : upload.status ===
                            "done"
                          ? "text-green-600"
                          : "text-blue-500"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {
                      upload.file
                        .name
                    }
                  </p>

                  {upload.status ===
                    "uploading" && (
                    <div className="mt-1.5">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{
                            width: `${upload.progress}%`,
                          }}
                        />
                      </div>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {
                          upload.progress
                        }
                        %
                      </p>
                    </div>
                  )}

                  {upload.status ===
                    "error" && (
                    <p className="text-xs text-red-600 mt-0.5">
                      {
                        upload.error
                      }
                    </p>
                  )}

                  {upload.status ===
                    "done" && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Uploaded
                      successfully
                    </p>
                  )}
                </div>

                {upload.status ===
                  "done" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}

                {upload.status ===
                  "error" && (
                  <button
                    onClick={() =>
                      setUploads(
                        (
                          prev,
                        ) =>
                          prev.filter(
                            (
                              _,
                              j,
                            ) =>
                              j !==
                              i,
                          ),
                      )
                    }
                    className="flex-shrink-0 p-1 rounded text-red-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}