import dbConnect from "@/db/connect";
import Chemical from "@/db/Chemical";

export default async function InventoryPage() {
  await dbConnect();
  const chemicals = await Chemical.find({});

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chemical Inventory</h1>
      <ul className="space-y-4">
        {chemicals.map((chem) => (
          <li
            key={chem._id.toString()}
            className="p-4 border rounded-lg shadow-sm"
          >
            <h2 className="font-semibold text-lg">
              {chem.name} ({chem.formula})
            </h2>
            <p>
              Stock: {chem.stockQuantity} {chem.unit}
            </p>
            <p className="text-gray-600">{chem.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
