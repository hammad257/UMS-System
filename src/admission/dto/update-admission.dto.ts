export class UpdateAdmissionRequestDto {
  firstName!: string;
  lastName!: string;
  email!: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  programId!: string;
  batchId?: string;
}