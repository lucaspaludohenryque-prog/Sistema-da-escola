export interface SeatingStudentInfo {
  id: string;
  name: string;
  registration: string;
  attendanceRate: number | null;
  overallAverage: number | null;
  pendingOccurrencesCount: number;
}

export interface SeatAssignmentRecord {
  studentId: string;
  row: number;
  col: number;
  student: SeatingStudentInfo;
}

export interface ClassroomSeatingData {
  classroomId: string;
  classroomName: string;
  subject: string;
  year: number;
  seatRows: number;
  seatCols: number;
  assignments: SeatAssignmentRecord[];
  unassignedStudents: SeatingStudentInfo[];
  allStudents: SeatingStudentInfo[];
}

export interface ClassroomSeatingOption {
  id: string;
  name: string;
  subject: string;
  year: number;
  studentCount: number;
}
