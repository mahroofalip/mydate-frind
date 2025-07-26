CREATE OR REPLACE FUNCTION public.handle_payment(
  p_user_id uuid,
  p_plan_id text,
  p_amount_inr integer,
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  plan record;
  expiry_ts timestamp with time zone;
  pay_id uuid;
BEGIN
  -- Get the plan duration
  SELECT duration_days
    INTO plan
    FROM public.subscription_plans
    WHERE id = p_plan_id;

  IF plan.duration_days IS NULL THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan_id;
  END IF;

  expiry_ts := now() + (plan.duration_days || ' days')::interval;

  -- 🔄 Update the existing 'pending' payment instead of inserting a new one
  UPDATE public.payments
  SET
    status = 'paid',
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_order_id = p_razorpay_order_id,
    updated_at = now()
  WHERE user_id = p_user_id
    AND plan_id = p_plan_id
    AND amount_inr = p_amount_inr
    AND status = 'pending'
  RETURNING id INTO pay_id;

  -- If no pending record exists, fallback to inserting (optional)
  IF NOT FOUND THEN
    INSERT INTO public.payments (
      user_id, plan_id, amount_inr, status, razorpay_payment_id, razorpay_order_id
    )
    VALUES (
      p_user_id, p_plan_id, p_amount_inr, 'paid', p_razorpay_payment_id, p_razorpay_order_id
    )
    RETURNING id INTO pay_id;
  END IF;

  -- Upsert the subscription
  INSERT INTO public.subscriptions AS subs (
    user_id, plan_id, status, start_date, end_date, payment_id
  )
  VALUES (
    p_user_id, p_plan_id, 'active', now(), expiry_ts, pay_id
  )
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id = excluded.plan_id,
        status = 'active',
        start_date = now(),
        end_date = excluded.end_date,
        updated_at = now(),
        payment_id = excluded.payment_id;

  -- Update user profile
  UPDATE public.profiles
  SET is_premium = true,
      premium_expires_at = expiry_ts
  WHERE id = p_user_id;
END;
$$;


------------------------


CREATE OR REPLACE FUNCTION public.revoke_expired_premium()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET is_premium = false
  WHERE is_premium = true AND premium_expires_at < now();
END;
$$;

----------------

-- Runs every day at 3:00 AM UTC
SELECT
  cron.schedule(
    'revoke_premium_daily',           -- unique job name
    '0 3 * * *',                      -- cron: 3 AM UTC daily
    $$SELECT public.revoke_expired_premium();$$
  );

SELECT * FROM cron.job;
