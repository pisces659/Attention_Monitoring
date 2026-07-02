import PageHeader from "@/components/dashboard/PageHeader";
import AddPatientCard from "@/components/patients/AddPatientCard";
import PatientCard from "@/components/patients/PatientCard";
import { getPatients } from "@/services";

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Patients"
        description="Manage pediatric cognitive therapy patients, review diagnoses, and open detailed session histories."
      />

      <AddPatientCard />

      <section
        aria-label="Patient directory"
        className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3"
      >
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </section>
    </div>
  );
}
