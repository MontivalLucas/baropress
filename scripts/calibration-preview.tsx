// Development-only visual fixture. Vite production entry never imports this file.
import React from "react";
import { createRoot } from "react-dom/client";
import { CalibrationPage } from "../src/features/calibration/CalibrationPage";
import { api } from "../src/services/database/api";
import { useSession } from "../src/stores/session";
import { useAcquisitionStore } from "../src/stores/acquisition";
import type { CalibrationData, Mat } from "../src/services/calibration/types";
import "../src/index.css";
const fixture:CalibrationData={mats:[],trials:[],profiles:[]};
const mat:Mat={id:"fixture-mat",identity:"Tapete sintético de prévia",revision:"TESTE VISUAL",firmware:"simulado",widthMm:300,heightMm:300,pitchXMm:20,pitchYMm:20,stripWidthMm:10,layers:"Fixture sem medições reais",capacityKg:null,orientation:"RAW_FLIP_X",cells:Array.from({length:225},(_,i)=>({xMm:(14-i%15+.5)*20,yMm:(Math.floor(i/15)+.5)*20,areaMm2:400,enabled:true,reason:""}))};
// ?empty=1 confere o primeiro cadastro com os padrões sem usar um banco real.
if (new URLSearchParams(location.search).get("empty") !== "1") fixture.mats.push(mat);
api.calibration.list=async()=>fixture;
api.calibration.saveMat=async m=>{fixture.mats.unshift(m);return m;};
api.calibration.begin=async()=>{throw new Error("Prévia visual: nenhum ensaio é gravado. Use o Tauri para coletar.");};
useSession.setState({user:{id:0,name:"Fixture visual",email:"fixture@example.invalid",role:"admin"}});
await useAcquisitionStore.getState().connect();
await useAcquisitionStore.getState().startAcquisition();
createRoot(document.getElementById("root")!).render(<React.StrictMode><div className="min-h-screen bg-background text-foreground"><p className="bg-purple-500/20 p-3 font-bold">PRÉVIA DE TESTE — SIMULAÇÃO — sem acesso ao banco pessoal</p><CalibrationPage/></div></React.StrictMode>);
