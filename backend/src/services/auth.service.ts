import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository.js';
import { LoginDTO, RegisterDTO } from '../schemas/auth.schema.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '8h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no configurado.');
}

class ServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const AuthService = {
  async register(data: RegisterDTO) {
    const existingByEmail = await AuthRepository.findByEmail(data.correo);
    const existingByUserName = await AuthRepository.findByUserName(data.nombre_usuario);

    if (existingByEmail || existingByUserName) {
      throw new ServiceError(409, 'Correo o nombre de usuario ya registrado.');
    }

    const hash = await bcrypt.hash(data.contrasena, 10);
    const user = await AuthRepository.createUser(data, hash);
    const token = jwt.sign(
      { sub: user.id_usuario, email: user.correo, rol: user.rol },
      JWT_SECRET as jwt.Secret,
      {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );

    return {
      token,
      usuario: {
        id: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
      },
    };
  },

  async login(data: LoginDTO) {
    const existing = await AuthRepository.findByEmail(data.correo);
    if (!existing) {
      throw new ServiceError(401, 'Correo o contraseña incorrectos.');
    }

    const isValidPassword = await bcrypt.compare(data.contrasena, existing.contrasena_hash);
    if (!isValidPassword) {
      throw new ServiceError(401, 'Correo o contraseña incorrectos.');
    }

    const token = jwt.sign(
      { sub: existing.id_usuario, email: existing.correo, rol: existing.rol },
      JWT_SECRET as jwt.Secret,
      {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );

    return {
      token,
      usuario: {
        id: existing.id_usuario,
        nombre_usuario: existing.nombre_usuario,
        nombre: existing.nombre,
        apellido: existing.apellido,
        correo: existing.correo,
        rol: existing.rol,
      },
    };
  },
};
