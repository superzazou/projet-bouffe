alter table meal_plans drop constraint meal_plans_user_id_date_meal_type_key;

alter table meal_plans alter column recipe_id set not null;
