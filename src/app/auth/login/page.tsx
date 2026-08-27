import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
        Iniciar sesión
      </h2>
      <LoginForm />
    </div>
  );
}
