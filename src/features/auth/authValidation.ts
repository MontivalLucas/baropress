export const PASSWORD_HELP = "Use de 12 a 128 caracteres, com letras e números, sem espaços nas extremidades.";
export function passwordError(password: string, confirmation: string): string | null {
  if ([...password].length < 12 || [...password].length > 128 || !/\p{L}/u.test(password) || !/[0-9]/.test(password) || password.trim() !== password) return PASSWORD_HELP;
  if (["password1234", "123456789abc", "baropress1234", "administrador123", "senha1234567"].includes(password.toLowerCase())) return "Escolha uma senha menos previsível.";
  if (password !== confirmation) return "A confirmação não corresponde à senha.";
  return null;
}

