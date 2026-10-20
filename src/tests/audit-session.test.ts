import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({save:vi.fn(),wait:vi.fn(),logout:vi.fn(),disconnect:vi.fn(),reset:vi.fn(),user:vi.fn(),notice:vi.fn(),isSaving:false,hydrated:true,paused:false}));
vi.mock("@/services/database/api",()=>({api:{logout:mocks.logout},clearDatabaseCache:vi.fn()}));
vi.mock("@/services/usePreferencesSync",()=>({saveCurrentPreferences:mocks.save,waitForPreferencesWrites:mocks.wait}));
vi.mock("@/stores/preferences",()=>({usePreferencesStore:{getState:()=>({hydrated:mocks.hydrated}),setState:(s:{paused:boolean})=>{mocks.paused=s.paused;}}}));
vi.mock("@/stores/session",()=>({useSession:{getState:()=>({setUser:mocks.user,setNotice:mocks.notice})}}));
vi.mock("@/stores/acquisition",()=>({useAcquisitionStore:{getState:()=>({disconnect:mocks.disconnect})}}));
vi.mock("@/features/exams/examStore",()=>({useNewExamStore:{getState:()=>({isSaving:mocks.isSaving,isStarting:false,resetExam:mocks.reset})}}));
import { logout } from "@/features/auth/sessionActions";
beforeEach(()=>{vi.clearAllMocks();mocks.isSaving=false;mocks.hydrated=true;mocks.paused=false;});
describe("Auditoria — logout e preferências",()=>{
  it("salva a última preferência antes de revogar e limpar a sessão",async()=>{
    const order:string[]=[];mocks.save.mockImplementation(async()=>{expect(mocks.paused).toBe(true);order.push("save");});mocks.logout.mockImplementation(async()=>{order.push("logout");});mocks.disconnect.mockResolvedValue(undefined);
    await logout();expect(order).toEqual(["save","logout"]);expect(mocks.user).toHaveBeenCalledWith(null);expect(mocks.reset).toHaveBeenCalledOnce();expect(mocks.paused).toBe(false);
  });
  it("não encerra a sessão enquanto o exame está sendo salvo",async()=>{
    mocks.isSaving=true;await expect(logout()).rejects.toThrow("Aguarde");expect(mocks.save).not.toHaveBeenCalled();expect(mocks.logout).not.toHaveBeenCalled();
  });
});
