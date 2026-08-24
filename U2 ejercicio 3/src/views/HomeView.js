import { DESTINOS } from "../services/destinosData.js";
import DestinoCard from "../components/DestinoCard.js";

export default async function HomeView() {
  return `
    <h2>Destinos turísticos sostenibles de Baja California Sur</h2>
    <p class="subtitle">
      Información centralizada sobre los principales destinos naturales,
      históricos y recreativos del estado, pensada para promover un
      turismo responsable.
    </p>
    <div class="grid">
      ${DESTINOS.map((destino) => DestinoCard(destino)).join("")}
    </div>
  `;
}
