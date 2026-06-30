import { patients } from "./patients";

export const patientOptions = patients.map((patient) => ({
  id: patient.id,
  label: `${patient.firstName} ${patient.lastName} (${patient.id})`,
}));
