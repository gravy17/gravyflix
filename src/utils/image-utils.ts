import ImageKit from '@imagekit/nodejs';

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
});
export const uploadImage = async (imagePath: string, fileName: string, user: string) : Promise<string | undefined> => {
  try {
    const result = await client.files.upload({
      file: imagePath,
      fileName: fileName,
      folder: "/user_uploads/" + user,
    });
    return result.url;
  } catch (error) {
    console.log(error);
  }
}