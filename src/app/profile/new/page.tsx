import ProfileForm from "@/components/profile/ProfileForm";

export default function NewProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Añadir familiar
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Crea el perfil de la persona a la que MEMORIA ACTIVA va a llamar.
        </p>
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm sm:p-10">
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
