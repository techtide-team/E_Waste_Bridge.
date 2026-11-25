
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://xdyjfuntkvmwdeyysznv.supabase.co";

const supabaseKey = "sb_publishable_XUqq47FVP1AmU1bXPBLG_w_75ImPFbM";

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);
