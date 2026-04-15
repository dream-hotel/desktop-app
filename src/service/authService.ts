import { LoginRequest } from "../types/request/LoginRequest";
import { AuthResponse, User } from "../types/response/AuthResponse";

const MOCK_USERS: User[] = [
  {
    id: 1,
    username: "ElizabethM",
    fullName: "Elizabeth M.",
    role: "administrador",
    email: "elizabeth@stannum.com",
  },
  {
    id: 2,
    username: "AlanM",
    fullName: "Alan M.",
    role: "recepcionista",
    email: "alan@stannum.com",
  },
];

export async function login(request: LoginRequest): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const user = MOCK_USERS.find(
    (u) => u.username.toLowerCase() === request.username.toLowerCase()
  );

  if (!user) {
    return {
      success: false,
      message: "Usuario no encontrado",
    };
  }

  if (request.password !== "admin123") {
    return {
      success: false,
      message: "Contraseña incorrecta",
    };
  }

  return {
    success: true,
    message: "Inicio de sesión exitoso",
    user,
    token: "mock-jwt-token-" + user.id,
  };
}

export async function logout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
}
