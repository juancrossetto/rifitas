import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadRaffleImage(file: Buffer, publicId?: string) {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadOptions = {
      folder: 'rifas',
      public_id: publicId,
      transformation: [{ width: 1200, height: 630, crop: 'fill', quality: 'auto' }],
    }

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) return reject(error)
      resolve({ url: result.secure_url, publicId: result.public_id })
    }).end(file)
  })
}

export async function deleteRaffleImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}
