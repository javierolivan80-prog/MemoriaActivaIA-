import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div>
      <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
        Crear cuenta
      </h2>
      <SignupForm />
    </div>
  );
}
