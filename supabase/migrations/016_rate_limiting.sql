-- Bảng theo dõi số lượng Request của từng User cho từng Endpoint
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- Bật RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Chỉ Service Role (Backend) mới được phép thọc vào bảng này
CREATE POLICY "Service Role Full Access" 
    ON public.api_rate_limits 
    FOR ALL 
    TO service_role 
    USING (true);

-- Hàm RPC kiểm tra và tăng số đếm (Atomic Increment)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id uuid,
    p_endpoint text,
    p_max_requests integer,
    p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count integer;
    v_window_start timestamp with time zone;
BEGIN
    -- Tìm xem user này đã gọi API này trong thời gian gần đây chưa
    SELECT request_count, window_start 
    INTO v_current_count, v_window_start
    FROM public.api_rate_limits
    WHERE user_id = p_user_id AND endpoint = p_endpoint
    FOR UPDATE; -- Khóa dòng này lại để tránh Race Condition (Nhiều request tới cùng lúc)

    -- Nếu chưa có bản ghi nào, tạo mới và cho phép (trả về true)
    IF NOT FOUND THEN
        INSERT INTO public.api_rate_limits (user_id, endpoint, request_count, window_start)
        VALUES (p_user_id, p_endpoint, 1, now());
        RETURN true;
    END IF;

    -- Nếu khoảng thời gian đã qua (ví dụ: đã qua 1 phút), reset lại bộ đếm
    IF now() - v_window_start > (p_window_seconds || ' seconds')::interval THEN
        UPDATE public.api_rate_limits
        SET request_count = 1,
            window_start = now()
        WHERE user_id = p_user_id AND endpoint = p_endpoint;
        RETURN true;
    END IF;

    -- Nếu vẫn còn trong khoảng thời gian, kiểm tra xem đã vượt mức chưa
    IF v_current_count >= p_max_requests THEN
        RETURN false; -- KHÔNG CHO PHÉP (Rate Limit Exceeded)
    END IF;

    -- Tăng bộ đếm và cho phép
    UPDATE public.api_rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    
    RETURN true;
END;
$$;
