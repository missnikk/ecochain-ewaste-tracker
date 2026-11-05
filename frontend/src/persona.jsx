import { createContext, useContext } from "react";
import { PERSONAS } from "./services/chain";

export const PersonaContext = createContext({ persona: PERSONAS[0], setPersona: () => {} });
export const usePersona = () => useContext(PersonaContext);
