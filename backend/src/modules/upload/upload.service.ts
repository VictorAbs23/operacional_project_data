import { supabase } from '../../config/supabase.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function uploadProfilePhoto(
  userId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
): Promise<string> {
  if (!supabase) {
    throw new AppError('Storage service not configured', 503);
  }

  const ext = file.originalname.split('.').pop() || 'jpg';
  const filePath = `profiles/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new AppError(`Upload failed: ${error.message}`, 500);
  }

  const { data: urlData } = supabase.storage
    .from(env.SUPABASE_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  await prisma.user.update({
    where: { id: userId },
    data: { profilePhotoUrl: publicUrl },
  });

  return publicUrl;
}
