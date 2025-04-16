alter table "public"."courses_likes" 
add column "updated_at" timestamp with time zone default timezone('utc'::text, now());
