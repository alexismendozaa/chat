import axios from "axios";

export async function uploadImage(file, token) {
  const r = await fetch("/api/uploads/image", {
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
