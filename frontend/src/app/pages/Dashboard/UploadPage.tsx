import React, { useState } from "react";
import { useAppSelector } from "../../hooks/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../../Components/Button";
import { FaFilePdf, FaFileWord, FaFileAlt, FaTrash } from "react-icons/fa";
import { useUploadFilesMutation, useGetFilesQuery, useDeleteFileMutation } from "../../../Features/auth/authApi";

const UploadPage: React.FC = () => {
  const auth = useAppSelector((state) => state.auth);
  const token = auth.token;
  const navigate = useNavigate();
  const location = useLocation();
  const isSelectMode = location.search.includes('select=true');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [uploadFiles] = useUploadFilesMutation();
  const { data: filesData, isLoading: loadingFiles, refetch } = useGetFilesQuery();
  const [deleteFile] = useDeleteFileMutation();

  const uploadedFiles = filesData?.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMessage("Please select files to upload");
      return;
    }
    if (!token) {
      setMessage("Please login to upload files");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      await uploadFiles({ files: Array.from(files) });
      setMessage("Files uploaded successfully!");
      setFiles(null);
      refetch(); // Refresh the list
    } catch {
      setMessage("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFile(fileId);
      refetch(); // Refresh the list
    } catch {
      alert("Failed to delete file");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") return <FaFilePdf className="text-red-500 mr-2" />;
    if (mimeType === "application/msword" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return <FaFileWord className="text-blue-500 mr-2" />;
    return <FaFileAlt className="text-gray-500 mr-2" />;
  };

  return (
    <div className="max-h-screen p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-[#0D9165]">
          {isSelectMode ? "Select File for Quiz" : "Upload Files"}
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Files
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D9165]"
            accept=".txt,.pdf,.doc,.docx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Allowed: Text, PDF, Word documents
          </p>
        </div>

        {files && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Selected Files:
            </h3>
            <ul className="text-sm text-gray-600">
              {Array.from(files).map((file, index) => (
                <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          text={uploading ? "Uploading..." : "Upload Files"}
          onClick={handleUpload}
          disabled={uploading || !files}
          className={`w-full ${uploading ? "bg-gray-400" : "bg-[#0D9165]"} text-white py-2 px-4 rounded-md hover:bg-[#0a7a52] transition-colors`}
        />

        {message && (
          <p className={`mt-4 text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-[#0D9165]">Your Uploaded Files</h2>
          {loadingFiles ? (
            <p className="text-gray-500">Loading files...</p>
          ) : uploadedFiles.length === 0 ? (
            <p className="text-gray-500">No files uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {uploadedFiles.map((file) => (
                <li key={file._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    {getFileIcon(file.mimeType)}
                    <div>
                      <p className="font-medium text-gray-800">{file.originalName}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0D9165] hover:underline text-sm"
                    >
                      View
                    </a>
                    <div className="flex items-center space-x-2">
                      {isSelectMode && (
                        <button
                          onClick={() => {
                            navigate('/dashboard/quiz', { state: { selectedFileId: file._id, selectedFileName: file.originalName } });
                          }}
                          className="bg-[#0D9165] text-white px-3 py-1 rounded text-sm hover:bg-[#0a7a52] cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
