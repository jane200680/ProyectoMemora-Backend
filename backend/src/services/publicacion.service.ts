import { PublicacionRepository } from '../repositories/publicacion.repository.js';
import { CreatePublicacionDTO, UpdatePublicacionDTO } from '../schemas/publicacion.schema.js';

export const PublicacionService = {
  listAll() {
    return PublicacionRepository.findAll();
  },

  findById(id: number) {
    return PublicacionRepository.findById(id);
  },

  create(data: CreatePublicacionDTO, userId: number) {
    return PublicacionRepository.create({ ...data, id_usuario: userId });
  },

  update(id: number, data: UpdatePublicacionDTO) {
    return PublicacionRepository.update(id, data);
  },

  async remove(id: number) {
    const publicacion = await PublicacionRepository.findById(id);
    if (!publicacion) return false;
    await PublicacionRepository.remove(id);
    return true;
  },
};