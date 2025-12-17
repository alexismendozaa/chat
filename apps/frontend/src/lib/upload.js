import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

export async function uploadImage(file, token) {
  const r = await fetch(`${API_URL}/api/uploads/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType: file.type }),
  });

  const { uploadUrl, publicUrl } = await r.json();

  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  return publicUrl;
}
