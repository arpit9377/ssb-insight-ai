-- Create user_streaks table to track various streak types
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_login_streak INTEGER NOT NULL DEFAULT 0,
  best_login_streak INTEGER NOT NULL DEFAULT 0,
  current_test_streak INTEGER NOT NULL DEFAULT 0,
  best_test_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  last_test_date DATE,
  streak_freeze_count INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  level_rank TEXT NOT NULL DEFAULT 'Cadet',
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard_entries table for ranking users
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  total_tests_completed INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  weekly_points INTEGER NOT NULL DEFAULT 0,
  monthly_points INTEGER NOT NULL DEFAULT 0,
  city TEXT,
  avatar_url TEXT,
  rank_position INTEGER,
  category TEXT NOT NULL DEFAULT 'overall',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all streak data" 
ON public.user_streaks 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own streak data" 
ON public.user_streaks 
FOR ALL 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view all leaderboard entries" 
ON public.leaderboard_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage leaderboard entries" 
ON public.leaderboard_entries 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_leaderboard_entries_category ON public.leaderboard_entries(category);
CREATE INDEX idx_leaderboard_entries_points ON public.leaderboard_entries(total_points DESC);
CREATE INDEX idx_leaderboard_entries_streak ON public.leaderboard_entries(current_streak DESC);

-- Insert 100 dummy users with realistic Indian data
INSERT INTO public.leaderboard_entries (user_id, display_name, total_tests_completed, average_score, total_points, current_streak, weekly_points, monthly_points, city, avatar_url, rank_position, category) VALUES
('dummy_user_001', 'Arjun Sharma', 45, 87.5, 2340, 12, 420, 1850, 'Mumbai', NULL, 1, 'overall'),
('dummy_user_002', 'Priya Patel', 42, 85.2, 2180, 8, 380, 1720, 'Delhi', NULL, 2, 'overall'),
('dummy_user_003', 'Rajesh Kumar', 38, 82.1, 1950, 15, 350, 1580, 'Bangalore', NULL, 3, 'overall'),
('dummy_user_004', 'Sneha Gupta', 35, 89.3, 1890, 6, 320, 1450, 'Chennai', NULL, 4, 'overall'),
('dummy_user_005', 'Vikram Singh', 33, 84.7, 1820, 9, 310, 1380, 'Hyderabad', NULL, 5, 'overall'),
('dummy_user_006', 'Anita Verma', 31, 86.4, 1750, 11, 290, 1250, 'Pune', NULL, 6, 'overall'),
('dummy_user_007', 'Rohit Agarwal', 29, 83.8, 1680, 7, 280, 1180, 'Kolkata', NULL, 7, 'overall'),
('dummy_user_008', 'Kavya Nair', 28, 88.1, 1620, 13, 270, 1120, 'Kochi', NULL, 8, 'overall'),
('dummy_user_009', 'Amit Joshi', 26, 81.5, 1540, 5, 250, 1050, 'Ahmedabad', NULL, 9, 'overall'),
('dummy_user_010', 'Pooja Mehta', 25, 87.9, 1480, 10, 240, 980, 'Jaipur', NULL, 10, 'overall'),
('dummy_user_011', 'Sanjay Reddy', 24, 79.2, 1420, 4, 230, 920, 'Vijayawada', NULL, 11, 'overall'),
('dummy_user_012', 'Meera Iyer', 23, 85.6, 1360, 8, 220, 860, 'Coimbatore', NULL, 12, 'overall'),
('dummy_user_013', 'Karan Malhotra', 22, 82.3, 1300, 6, 210, 800, 'Chandigarh', NULL, 13, 'overall'),
('dummy_user_014', 'Ritu Saxena', 21, 86.7, 1240, 9, 200, 740, 'Lucknow', NULL, 14, 'overall'),
('dummy_user_015', 'Deepak Yadav', 20, 80.4, 1180, 3, 190, 680, 'Patna', NULL, 15, 'overall'),
('dummy_user_016', 'Sunita Bansal', 19, 84.1, 1120, 7, 180, 620, 'Indore', NULL, 16, 'overall'),
('dummy_user_017', 'Manoj Tiwari', 18, 78.9, 1060, 2, 170, 560, 'Varanasi', NULL, 17, 'overall'),
('dummy_user_018', 'Nisha Kapoor', 17, 83.5, 1000, 5, 160, 500, 'Amritsar', NULL, 18, 'overall'),
('dummy_user_019', 'Suresh Pandey', 16, 81.8, 940, 4, 150, 440, 'Kanpur', NULL, 19, 'overall'),
('dummy_user_020', 'Geeta Sinha', 15, 85.2, 880, 6, 140, 380, 'Ranchi', NULL, 20, 'overall'),
('dummy_user_021', 'Ashok Mishra', 14, 77.6, 820, 1, 130, 320, 'Allahabad', NULL, 21, 'overall'),
('dummy_user_022', 'Rekha Jain', 13, 82.9, 760, 3, 120, 260, 'Gwalior', NULL, 22, 'overall'),
('dummy_user_023', 'Naveen Kumar', 12, 79.3, 700, 2, 110, 200, 'Dehradun', NULL, 23, 'overall'),
('dummy_user_024', 'Shilpa Rao', 11, 84.6, 640, 4, 100, 180, 'Mysore', NULL, 24, 'overall'),
('dummy_user_025', 'Harish Chandra', 10, 76.4, 580, 1, 90, 160, 'Shimla', NULL, 25, 'overall'),
('dummy_user_026', 'Madhuri Devi', 9, 81.7, 520, 2, 80, 140, 'Bhopal', NULL, 26, 'overall'),
('dummy_user_027', 'Ravi Prakash', 8, 78.1, 460, 0, 70, 120, 'Agra', NULL, 27, 'overall'),
('dummy_user_028', 'Seema Agarwal', 7, 83.4, 400, 1, 60, 100, 'Meerut', NULL, 28, 'overall'),
('dummy_user_029', 'Pramod Singh', 6, 75.8, 340, 0, 50, 80, 'Varanasi', NULL, 29, 'overall'),
('dummy_user_030', 'Urmila Sharma', 5, 80.2, 280, 1, 40, 60, 'Jodhpur', NULL, 30, 'overall'),
('dummy_user_031', 'Dinesh Gupta', 25, 88.4, 1450, 14, 280, 920, 'Noida', NULL, 31, 'overall'),
('dummy_user_032', 'Lalita Singh', 23, 86.1, 1320, 12, 260, 840, 'Gurgaon', NULL, 32, 'overall'),
('dummy_user_033', 'Mohit Sharma', 21, 84.7, 1190, 10, 240, 760, 'Faridabad', NULL, 33, 'overall'),
('dummy_user_034', 'Bharti Kumari', 19, 87.3, 1060, 8, 220, 680, 'Ghaziabad', NULL, 34, 'overall'),
('dummy_user_035', 'Vijay Gupta', 17, 82.9, 930, 6, 200, 600, 'Lucknow', NULL, 35, 'overall'),
('dummy_user_036', 'Sunita Devi', 15, 85.6, 800, 4, 180, 520, 'Kanpur', NULL, 36, 'overall'),
('dummy_user_037', 'Ramesh Yadav', 13, 80.2, 670, 2, 160, 440, 'Agra', NULL, 37, 'overall'),
('dummy_user_038', 'Poonam Verma', 11, 83.8, 540, 3, 140, 360, 'Meerut', NULL, 38, 'overall'),
('dummy_user_039', 'Sunil Kumar', 9, 78.4, 410, 1, 120, 280, 'Allahabad', NULL, 39, 'overall'),
('dummy_user_040', 'Neeta Joshi', 7, 81.1, 280, 0, 100, 200, 'Varanasi', NULL, 40, 'overall'),
('dummy_user_041', 'Alok Pandey', 30, 89.2, 1680, 16, 320, 1120, 'Bhubaneswar', NULL, 41, 'overall'),
('dummy_user_042', 'Swati Mishra', 28, 87.5, 1540, 14, 300, 1040, 'Cuttack', NULL, 42, 'overall'),
('dummy_user_043', 'Rakesh Nath', 26, 85.8, 1400, 12, 280, 960, 'Rourkela', NULL, 43, 'overall'),
('dummy_user_044', 'Priyanka Das', 24, 88.1, 1260, 10, 260, 880, 'Berhampur', NULL, 44, 'overall'),
('dummy_user_045', 'Santosh Behera', 22, 83.7, 1120, 8, 240, 800, 'Sambalpur', NULL, 45, 'overall'),
('dummy_user_046', 'Manisha Sahoo', 20, 86.4, 980, 6, 220, 720, 'Puri', NULL, 46, 'overall'),
('dummy_user_047', 'Biswajit Mohanty', 18, 81.9, 840, 4, 200, 640, 'Balasore', NULL, 47, 'overall'),
('dummy_user_048', 'Sushma Panda', 16, 84.2, 700, 5, 180, 560, 'Angul', NULL, 48, 'overall'),
('dummy_user_049', 'Subash Jena', 14, 79.6, 560, 3, 160, 480, 'Jeypore', NULL, 49, 'overall'),
('dummy_user_050', 'Laxmi Parida', 12, 82.3, 420, 2, 140, 400, 'Rayagada', NULL, 50, 'overall'),
('dummy_user_051', 'Ajay Thakur', 27, 90.1, 1590, 18, 340, 1080, 'Chandigarh', NULL, 51, 'overall'),
('dummy_user_052', 'Ruchi Aggarwal', 25, 88.7, 1450, 16, 320, 1000, 'Ludhiana', NULL, 52, 'overall'),
('dummy_user_053', 'Gaurav Sethi', 23, 86.3, 1310, 14, 300, 920, 'Amritsar', NULL, 53, 'overall'),
('dummy_user_054', 'Simran Kaur', 21, 89.5, 1170, 12, 280, 840, 'Jalandhar', NULL, 54, 'overall'),
('dummy_user_055', 'Hardeep Singh', 19, 84.8, 1030, 10, 260, 760, 'Patiala', NULL, 55, 'overall'),
('dummy_user_056', 'Manpreet Kaur', 17, 87.1, 890, 8, 240, 680, 'Bathinda', NULL, 56, 'overall'),
('dummy_user_057', 'Jagdeep Singh', 15, 82.4, 750, 6, 220, 600, 'Hoshiarpur', NULL, 57, 'overall'),
('dummy_user_058', 'Parminder Kaur', 13, 85.7, 610, 4, 200, 520, 'Moga', NULL, 58, 'overall'),
('dummy_user_059', 'Sukhwinder Singh', 11, 80.9, 470, 2, 180, 440, 'Firozpur', NULL, 59, 'overall'),
('dummy_user_060', 'Gurpreet Kaur', 9, 83.2, 330, 1, 160, 360, 'Kapurthala', NULL, 60, 'overall'),
('dummy_user_061', 'Abhishek Jha', 32, 91.3, 1720, 20, 360, 1200, 'Patna', NULL, 61, 'overall'),
('dummy_user_062', 'Asha Kumari', 30, 89.6, 1580, 18, 340, 1120, 'Gaya', NULL, 62, 'overall'),
('dummy_user_063', 'Pankaj Singh', 28, 87.9, 1440, 16, 320, 1040, 'Muzaffarpur', NULL, 63, 'overall'),
('dummy_user_064', 'Sunita Devi', 26, 90.2, 1300, 14, 300, 960, 'Darbhanga', NULL, 64, 'overall'),
('dummy_user_065', 'Rajkumar Yadav', 24, 85.5, 1160, 12, 280, 880, 'Bhagalpur', NULL, 65, 'overall'),
('dummy_user_066', 'Manju Kumari', 22, 88.8, 1020, 10, 260, 800, 'Purnia', NULL, 66, 'overall'),
('dummy_user_067', 'Ramesh Thakur', 20, 83.1, 880, 8, 240, 720, 'Chhapra', NULL, 67, 'overall'),
('dummy_user_068', 'Kiran Devi', 18, 86.4, 740, 6, 220, 640, 'Saharsa', NULL, 68, 'overall'),
('dummy_user_069', 'Deepak Kumar', 16, 81.7, 600, 4, 200, 560, 'Begusarai', NULL, 69, 'overall'),
('dummy_user_070', 'Renu Kumari', 14, 84.0, 460, 2, 180, 480, 'Katihar', NULL, 70, 'overall'),
('dummy_user_071', 'Akash Verma', 29, 92.4, 1650, 22, 380, 1160, 'Jaipur', NULL, 71, 'overall'),
('dummy_user_072', 'Kavita Sharma', 27, 90.7, 1510, 20, 360, 1080, 'Jodhpur', NULL, 72, 'overall'),
('dummy_user_073', 'Rohit Gupta', 25, 88.0, 1370, 18, 340, 1000, 'Kota', NULL, 73, 'overall'),
('dummy_user_074', 'Neha Agarwal', 23, 91.1, 1230, 16, 320, 920, 'Udaipur', NULL, 74, 'overall'),
('dummy_user_075', 'Vivek Jain', 21, 86.6, 1090, 14, 300, 840, 'Ajmer', NULL, 75, 'overall'),
('dummy_user_076', 'Sapna Kumari', 19, 89.3, 950, 12, 280, 760, 'Bikaner', NULL, 76, 'overall'),
('dummy_user_077', 'Mahesh Chand', 17, 84.9, 810, 10, 260, 680, 'Alwar', NULL, 77, 'overall'),
('dummy_user_078', 'Pooja Meena', 15, 87.6, 670, 8, 240, 600, 'Bharatpur', NULL, 78, 'overall'),
('dummy_user_079', 'Suresh Sharma', 13, 82.2, 530, 6, 220, 520, 'Sikar', NULL, 79, 'overall'),
('dummy_user_080', 'Anita Gupta', 11, 85.8, 390, 4, 200, 440, 'Pali', NULL, 80, 'overall'),
('dummy_user_081', 'Nitin Bhardwaj', 31, 93.1, 1690, 24, 400, 1240, 'Dehradun', NULL, 81, 'overall'),
('dummy_user_082', 'Ritu Nautiyal', 29, 91.4, 1550, 22, 380, 1160, 'Haridwar', NULL, 82, 'overall'),
('dummy_user_083', 'Anil Rawat', 27, 89.7, 1410, 20, 360, 1080, 'Roorkee', NULL, 83, 'overall'),
('dummy_user_084', 'Priya Bisht', 25, 92.0, 1270, 18, 340, 1000, 'Nainital', NULL, 84, 'overall'),
('dummy_user_085', 'Sandeep Panwar', 23, 87.3, 1130, 16, 320, 920, 'Rudrapur', NULL, 85, 'overall'),
('dummy_user_086', 'Meera Joshi', 21, 90.6, 990, 14, 300, 840, 'Haldwani', NULL, 86, 'overall'),
('dummy_user_087', 'Vinod Negi', 19, 85.9, 850, 12, 280, 760, 'Pithoragarh', NULL, 87, 'overall'),
('dummy_user_088', 'Sunita Rawat', 17, 88.2, 710, 10, 260, 680, 'Almora', NULL, 88, 'overall'),
('dummy_user_089', 'Rajesh Gusain', 15, 83.5, 570, 8, 240, 600, 'Pauri', NULL, 89, 'overall'),
('dummy_user_090', 'Kamala Devi', 13, 86.8, 430, 6, 220, 520, 'Bageshwar', NULL, 90, 'overall'),
('dummy_user_091', 'Tarun Malhotra', 26, 89.4, 1380, 15, 310, 960, 'Shimla', NULL, 91, 'overall'),
('dummy_user_092', 'Sonia Thakur', 24, 87.7, 1240, 13, 290, 880, 'Manali', NULL, 92, 'overall'),
('dummy_user_093', 'Rajesh Verma', 22, 85.0, 1100, 11, 270, 800, 'Dharamshala', NULL, 93, 'overall'),
('dummy_user_094', 'Nisha Sharma', 20, 88.3, 960, 9, 250, 720, 'Kullu', NULL, 94, 'overall'),
('dummy_user_095', 'Amit Chauhan', 18, 83.6, 820, 7, 230, 640, 'Solan', NULL, 95, 'overall'),
('dummy_user_096', 'Rekha Devi', 16, 86.9, 680, 5, 210, 560, 'Mandi', NULL, 96, 'overall'),
('dummy_user_097', 'Sunil Thakur', 14, 81.2, 540, 3, 190, 480, 'Hamirpur', NULL, 97, 'overall'),
('dummy_user_098', 'Geeta Kumari', 12, 84.5, 400, 4, 170, 400, 'Bilaspur', NULL, 98, 'overall'),
('dummy_user_099', 'Mohan Singh', 10, 79.8, 260, 2, 150, 320, 'Una', NULL, 99, 'overall'),
('dummy_user_100', 'Radha Devi', 8, 82.1, 120, 1, 130, 240, 'Chamba', NULL, 100, 'overall');

-- Insert corresponding user_streaks data for dummy users
INSERT INTO public.user_streaks (user_id, current_login_streak, best_login_streak, current_test_streak, best_test_streak, last_login_date, last_test_date, total_points, level_rank, badges) VALUES
('dummy_user_001', 12, 25, 8, 15, CURRENT_DATE, CURRENT_DATE - 1, 2340, 'Captain', '["streak_master", "top_performer", "consistent_learner"]'::jsonb),
('dummy_user_002', 8, 18, 5, 12, CURRENT_DATE, CURRENT_DATE - 2, 2180, 'Lieutenant', '["top_performer", "dedicated_student"]'::jsonb),
('dummy_user_003', 15, 22, 10, 18, CURRENT_DATE, CURRENT_DATE, 1950, 'Captain', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_004', 6, 14, 4, 9, CURRENT_DATE - 1, CURRENT_DATE - 3, 1890, 'Lieutenant', '["top_performer"]'::jsonb),
('dummy_user_005', 9, 16, 6, 11, CURRENT_DATE, CURRENT_DATE - 1, 1820, 'Lieutenant', '["consistent_learner"]'::jsonb),
('dummy_user_006', 11, 20, 7, 13, CURRENT_DATE, CURRENT_DATE, 1750, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_007', 7, 12, 3, 8, CURRENT_DATE - 2, CURRENT_DATE - 4, 1680, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_008', 13, 19, 9, 14, CURRENT_DATE, CURRENT_DATE, 1620, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_009', 5, 11, 2, 7, CURRENT_DATE - 3, CURRENT_DATE - 5, 1540, 'Sergeant', '[]'::jsonb),
('dummy_user_010', 10, 17, 6, 10, CURRENT_DATE, CURRENT_DATE - 1, 1480, 'Lieutenant', '["consistent_learner"]'::jsonb),
('dummy_user_011', 4, 9, 1, 6, CURRENT_DATE - 4, CURRENT_DATE - 6, 1420, 'Sergeant', '[]'::jsonb),
('dummy_user_012', 8, 15, 5, 9, CURRENT_DATE - 1, CURRENT_DATE - 2, 1360, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_013', 6, 13, 3, 8, CURRENT_DATE - 2, CURRENT_DATE - 3, 1300, 'Sergeant', '[]'::jsonb),
('dummy_user_014', 9, 16, 6, 11, CURRENT_DATE, CURRENT_DATE - 1, 1240, 'Sergeant', '["consistent_learner"]'::jsonb),
('dummy_user_015', 3, 8, 1, 5, CURRENT_DATE - 5, CURRENT_DATE - 7, 1180, 'Corporal', '[]'::jsonb),
('dummy_user_016', 7, 14, 4, 9, CURRENT_DATE - 1, CURRENT_DATE - 2, 1120, 'Sergeant', '[]'::jsonb),
('dummy_user_017', 2, 7, 0, 4, CURRENT_DATE - 6, CURRENT_DATE - 8, 1060, 'Corporal', '[]'::jsonb),
('dummy_user_018', 5, 12, 2, 7, CURRENT_DATE - 3, CURRENT_DATE - 4, 1000, 'Corporal', '[]'::jsonb),
('dummy_user_019', 4, 10, 1, 6, CURRENT_DATE - 4, CURRENT_DATE - 5, 940, 'Corporal', '[]'::jsonb),
('dummy_user_020', 6, 13, 3, 8, CURRENT_DATE - 2, CURRENT_DATE - 3, 880, 'Corporal', '[]'::jsonb),
('dummy_user_021', 1, 6, 0, 3, CURRENT_DATE - 7, CURRENT_DATE - 9, 820, 'Private', '[]'::jsonb),
('dummy_user_022', 3, 9, 1, 5, CURRENT_DATE - 5, CURRENT_DATE - 6, 760, 'Private', '[]'::jsonb),
('dummy_user_023', 2, 8, 0, 4, CURRENT_DATE - 6, CURRENT_DATE - 7, 700, 'Private', '[]'::jsonb),
('dummy_user_024', 4, 11, 2, 6, CURRENT_DATE - 4, CURRENT_DATE - 4, 640, 'Private', '[]'::jsonb),
('dummy_user_025', 1, 5, 0, 3, CURRENT_DATE - 8, CURRENT_DATE - 10, 580, 'Cadet', '[]'::jsonb),
('dummy_user_026', 2, 7, 1, 4, CURRENT_DATE - 6, CURRENT_DATE - 7, 520, 'Cadet', '[]'::jsonb),
('dummy_user_027', 0, 4, 0, 2, CURRENT_DATE - 10, CURRENT_DATE - 12, 460, 'Cadet', '[]'::jsonb),
('dummy_user_028', 1, 6, 0, 3, CURRENT_DATE - 8, CURRENT_DATE - 9, 400, 'Cadet', '[]'::jsonb),
('dummy_user_029', 0, 3, 0, 2, CURRENT_DATE - 12, CURRENT_DATE - 14, 340, 'Cadet', '[]'::jsonb),
('dummy_user_030', 1, 5, 0, 3, CURRENT_DATE - 9, CURRENT_DATE - 10, 280, 'Cadet', '[]'::jsonb),
('dummy_user_031', 14, 21, 9, 16, CURRENT_DATE, CURRENT_DATE, 1450, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_032', 12, 19, 7, 14, CURRENT_DATE, CURRENT_DATE - 1, 1320, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_033', 10, 17, 6, 12, CURRENT_DATE, CURRENT_DATE - 1, 1190, 'Sergeant', '["consistent_learner"]'::jsonb),
('dummy_user_034', 8, 15, 5, 10, CURRENT_DATE - 1, CURRENT_DATE - 2, 1060, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_035', 6, 13, 3, 8, CURRENT_DATE - 2, CURRENT_DATE - 3, 930, 'Sergeant', '[]'::jsonb),
('dummy_user_036', 4, 11, 2, 6, CURRENT_DATE - 4, CURRENT_DATE - 4, 800, 'Corporal', '[]'::jsonb),
('dummy_user_037', 2, 9, 1, 4, CURRENT_DATE - 6, CURRENT_DATE - 6, 670, 'Corporal', '[]'::jsonb),
('dummy_user_038', 3, 10, 1, 5, CURRENT_DATE - 5, CURRENT_DATE - 5, 540, 'Private', '[]'::jsonb),
('dummy_user_039', 1, 7, 0, 3, CURRENT_DATE - 8, CURRENT_DATE - 8, 410, 'Private', '[]'::jsonb),
('dummy_user_040', 0, 5, 0, 2, CURRENT_DATE - 10, CURRENT_DATE - 10, 280, 'Cadet', '[]'::jsonb),
('dummy_user_041', 16, 23, 11, 19, CURRENT_DATE, CURRENT_DATE, 1680, 'Captain', '["streak_master", "top_performer", "daily_warrior"]'::jsonb),
('dummy_user_042', 14, 21, 9, 17, CURRENT_DATE, CURRENT_DATE, 1540, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_043', 12, 19, 8, 15, CURRENT_DATE, CURRENT_DATE - 1, 1400, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_044', 10, 17, 6, 13, CURRENT_DATE - 1, CURRENT_DATE - 1, 1260, 'Lieutenant', '["consistent_learner"]'::jsonb),
('dummy_user_045', 8, 15, 5, 11, CURRENT_DATE - 1, CURRENT_DATE - 2, 1120, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_046', 6, 13, 4, 9, CURRENT_DATE - 2, CURRENT_DATE - 2, 980, 'Sergeant', '[]'::jsonb),
('dummy_user_047', 4, 11, 2, 7, CURRENT_DATE - 4, CURRENT_DATE - 4, 840, 'Corporal', '[]'::jsonb),
('dummy_user_048', 5, 12, 3, 8, CURRENT_DATE - 3, CURRENT_DATE - 3, 700, 'Corporal', '[]'::jsonb),
('dummy_user_049', 3, 9, 1, 5, CURRENT_DATE - 5, CURRENT_DATE - 5, 560, 'Private', '[]'::jsonb),
('dummy_user_050', 2, 8, 1, 4, CURRENT_DATE - 6, CURRENT_DATE - 6, 420, 'Private', '[]'::jsonb),
('dummy_user_051', 18, 25, 12, 21, CURRENT_DATE, CURRENT_DATE, 1590, 'Captain', '["streak_master", "top_performer", "daily_warrior"]'::jsonb),
('dummy_user_052', 16, 23, 10, 19, CURRENT_DATE, CURRENT_DATE, 1450, 'Captain', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_053', 14, 21, 9, 17, CURRENT_DATE, CURRENT_DATE, 1310, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_054', 12, 19, 8, 15, CURRENT_DATE, CURRENT_DATE - 1, 1170, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_055', 10, 17, 6, 13, CURRENT_DATE - 1, CURRENT_DATE - 1, 1030, 'Lieutenant', '["consistent_learner"]'::jsonb),
('dummy_user_056', 8, 15, 5, 11, CURRENT_DATE - 1, CURRENT_DATE - 2, 890, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_057', 6, 13, 4, 9, CURRENT_DATE - 2, CURRENT_DATE - 2, 750, 'Sergeant', '[]'::jsonb),
('dummy_user_058', 4, 11, 2, 7, CURRENT_DATE - 4, CURRENT_DATE - 4, 610, 'Corporal', '[]'::jsonb),
('dummy_user_059', 2, 9, 1, 5, CURRENT_DATE - 6, CURRENT_DATE - 6, 470, 'Private', '[]'::jsonb),
('dummy_user_060', 1, 7, 0, 3, CURRENT_DATE - 8, CURRENT_DATE - 8, 330, 'Private', '[]'::jsonb),
('dummy_user_061', 20, 27, 14, 23, CURRENT_DATE, CURRENT_DATE, 1720, 'Captain', '["streak_master", "top_performer", "daily_warrior", "legend"]'::jsonb),
('dummy_user_062', 18, 25, 12, 21, CURRENT_DATE, CURRENT_DATE, 1580, 'Captain', '["streak_master", "top_performer", "daily_warrior"]'::jsonb),
('dummy_user_063', 16, 23, 10, 19, CURRENT_DATE, CURRENT_DATE, 1440, 'Captain', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_064', 14, 21, 9, 17, CURRENT_DATE, CURRENT_DATE, 1300, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_065', 12, 19, 8, 15, CURRENT_DATE, CURRENT_DATE - 1, 1160, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_066', 10, 17, 6, 13, CURRENT_DATE - 1, CURRENT_DATE - 1, 1020, 'Lieutenant', '["consistent_learner"]'::jsonb),
('dummy_user_067', 8, 15, 5, 11, CURRENT_DATE - 1, CURRENT_DATE - 2, 880, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_068', 6, 13, 4, 9, CURRENT_DATE - 2, CURRENT_DATE - 2, 740, 'Sergeant', '[]'::jsonb),
('dummy_user_069', 4, 11, 2, 7, CURRENT_DATE - 4, CURRENT_DATE - 4, 600, 'Corporal', '[]'::jsonb),
('dummy_user_070', 2, 9, 1, 5, CURRENT_DATE - 6, CURRENT_DATE - 6, 460, 'Private', '[]'::jsonb),
('dummy_user_071', 22, 29, 15, 25, CURRENT_DATE, CURRENT_DATE, 1650, 'Captain', '["streak_master", "top_performer", "daily_warrior", "legend"]'::jsonb),
('dummy_user_072', 20, 27, 13, 23, CURRENT_DATE, CURRENT_DATE, 1510, 'Captain', '["streak_master", "top_performer", "daily_warrior"]'::jsonb),
('dummy_user_073', 18, 25, 12, 21, CURRENT_DATE, CURRENT_DATE, 1370, 'Captain', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_074', 16, 23, 10, 19, CURRENT_DATE, CURRENT_DATE, 1230, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_075', 14, 21, 9, 17, CURRENT_DATE, CURRENT_DATE - 1, 1090, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_076', 12, 19, 8, 15, CURRENT_DATE, CURRENT_DATE - 1, 950, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_077', 10, 17, 6, 13, CURRENT_DATE - 1, CURRENT_DATE - 1, 810, 'Sergeant', '["consistent_learner"]'::jsonb),
('dummy_user_078', 8, 15, 5, 11, CURRENT_DATE - 1, CURRENT_DATE - 2, 670, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_079', 6, 13, 4, 9, CURRENT_DATE - 2, CURRENT_DATE - 2, 530, 'Corporal', '[]'::jsonb),
('dummy_user_080', 4, 11, 2, 7, CURRENT_DATE - 4, CURRENT_DATE - 4, 390, 'Private', '[]'::jsonb),
('dummy_user_081', 24, 31, 16, 27, CURRENT_DATE, CURRENT_DATE, 1690, 'Captain', '["streak_master", "top_performer", "daily_warrior", "legend"]'::jsonb),
('dummy_user_082', 22, 29, 14, 25, CURRENT_DATE, CURRENT_DATE, 1550, 'Captain', '["streak_master", "top_performer", "daily_warrior"]'::jsonb),
('dummy_user_083', 20, 27, 13, 23, CURRENT_DATE, CURRENT_DATE, 1410, 'Captain', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_084', 18, 25, 12, 21, CURRENT_DATE, CURRENT_DATE, 1270, 'Captain', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_085', 16, 23, 10, 19, CURRENT_DATE, CURRENT_DATE - 1, 1130, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_086', 14, 21, 9, 17, CURRENT_DATE, CURRENT_DATE - 1, 990, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_087', 12, 19, 8, 15, CURRENT_DATE - 1, CURRENT_DATE - 1, 850, 'Sergeant', '["consistent_learner"]'::jsonb),
('dummy_user_088', 10, 17, 6, 13, CURRENT_DATE - 1, CURRENT_DATE - 2, 710, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_089', 8, 15, 5, 11, CURRENT_DATE - 2, CURRENT_DATE - 2, 570, 'Corporal', '[]'::jsonb),
('dummy_user_090', 6, 13, 4, 9, CURRENT_DATE - 4, CURRENT_DATE - 4, 430, 'Private', '[]'::jsonb),
('dummy_user_091', 15, 22, 10, 18, CURRENT_DATE, CURRENT_DATE, 1380, 'Lieutenant', '["streak_master", "daily_warrior"]'::jsonb),
('dummy_user_092', 13, 20, 8, 16, CURRENT_DATE, CURRENT_DATE - 1, 1240, 'Lieutenant', '["streak_master"]'::jsonb),
('dummy_user_093', 11, 18, 7, 14, CURRENT_DATE - 1, CURRENT_DATE - 1, 1100, 'Lieutenant', '["consistent_learner"]'::jsonb),
('dummy_user_094', 9, 16, 5, 12, CURRENT_DATE - 1, CURRENT_DATE - 2, 960, 'Sergeant', '["dedicated_student"]'::jsonb),
('dummy_user_095', 7, 14, 4, 10, CURRENT_DATE - 2, CURRENT_DATE - 2, 820, 'Sergeant', '[]'::jsonb),
('dummy_user_096', 5, 12, 3, 8, CURRENT_DATE - 3, CURRENT_DATE - 3, 680, 'Corporal', '[]'::jsonb),
('dummy_user_097', 3, 10, 1, 6, CURRENT_DATE - 5, CURRENT_DATE - 5, 540, 'Private', '[]'::jsonb),
('dummy_user_098', 4, 11, 2, 7, CURRENT_DATE - 4, CURRENT_DATE - 4, 400, 'Private', '[]'::jsonb),
('dummy_user_099', 2, 8, 1, 4, CURRENT_DATE - 6, CURRENT_DATE - 6, 260, 'Cadet', '[]'::jsonb),
('dummy_user_100', 1, 6, 0, 3, CURRENT_DATE - 8, CURRENT_DATE - 8, 120, 'Cadet', '[]'::jsonb);

-- Create function to update streak and leaderboard data
CREATE OR REPLACE FUNCTION public.update_user_streak(target_user_id TEXT, activity_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_streak_count INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Insert or update user streak record
  INSERT INTO public.user_streaks (user_id, current_login_streak, last_login_date, updated_at)
  VALUES (target_user_id, 1, today_date, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_login_streak = CASE 
      WHEN user_streaks.last_login_date = today_date - 1 THEN user_streaks.current_login_streak + 1
      WHEN user_streaks.last_login_date = today_date THEN user_streaks.current_login_streak
      ELSE 1
    END,
    best_login_streak = GREATEST(
      user_streaks.best_login_streak,
      CASE 
        WHEN user_streaks.last_login_date = today_date - 1 THEN user_streaks.current_login_streak + 1
        WHEN user_streaks.last_login_date = today_date THEN user_streaks.current_login_streak
        ELSE 1
      END
    ),
    last_login_date = today_date,
    updated_at = NOW();

  -- Award points based on streak
  UPDATE public.user_streaks 
  SET total_points = total_points + (current_login_streak * 10)
  WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$$;