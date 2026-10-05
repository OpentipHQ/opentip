import { BlobServiceClient } from "@azure/storage-blob";

const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT;
const ACCOUNT_KEY = process.env.AZURE_STORAGE_KEY;
const CONTAINER = "opentip-uploads";

function getBlobService(): BlobServiceClient {
  if (!ACCOUNT_NAME || !ACCOUNT_KEY) {
    throw new Error("AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY must be set");
  }
  const conn = `DefaultEndpointsProtocol=https;AccountName=${ACCOUNT_NAME};AccountKey=${ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(conn);
}

function getExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "bin";
}

export async function uploadImage(
  file: File,
  folder: "pfp" | "header" | "repo-icon"
): Promise<string> {
  const ext = getExt(file.type);
  const id = crypto.randomUUID();
  const blobName = `${folder}/${id}.${ext}`;

  const blobService = getBlobService();
  const container = blobService.getContainerClient(CONTAINER);
  await container.createIfNotExists({ access: "blob" });

  const blockBlob = container.getBlockBlobClient(blobName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: file.type },
  });

  return blockBlob.url;
}
