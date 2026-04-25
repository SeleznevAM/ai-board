import Link from "next/link";

import { AssigneeDirectoryForm } from "../../src/components/assignee-directory-form";

export default function AssigneesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
      }}
    >
      <section
        style={{
          width: "min(920px, 100%)",
          display: "grid",
          gap: "24px",
        }}
      >
        <Link href="/" style={{ color: "#6f4a16", textDecoration: "none", fontWeight: 700 }}>
          Вернуться к требованию
        </Link>
        <AssigneeDirectoryForm />
      </section>
    </main>
  );
}
