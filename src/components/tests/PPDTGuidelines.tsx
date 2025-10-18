import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

export const PPDTGuidelines = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          View PPDT Guidelines
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">PPDT Writing Formula - SSB Success Guide</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Key Message */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-lg font-semibold text-blue-900 mb-2">
                🎯 Remember: PPDT is NOT creative writing!
              </p>
              <p className="text-blue-800">
                It's about showing you can <strong>PLAN</strong> and <strong>EXECUTE</strong> with specific details.
              </p>
            </CardContent>
          </Card>

          {/* 4-Step Structure */}
          <div>
            <h3 className="text-xl font-bold mb-4">The 4-Step Structure</h3>
            
            {/* Step 1: WHO */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <h4 className="font-bold text-lg mb-3 text-green-700">STEP 1: WHO? (Character Setup)</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Specific name:</strong> Rahul, Amit, Priya (NOT "the boy", "the man")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Age and role:</strong> 28 years, SDM / 26 years, engineer / 30 years, teacher</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Exact location:</strong> posted in Thoubal, Manipur / working in Leh district</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-green-50 rounded">
                  <p className="text-sm font-medium">Example:</p>
                  <p className="text-sm italic">"Rahul, 28 years, was just posted as SDM in Thoubal district of Manipur"</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: WHAT */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <h4 className="font-bold text-lg mb-3 text-blue-700">STEP 2: WHAT? (Problem/Opportunity)</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>What did they see/encounter?</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Specific place:</strong> between which villages, which river, which road</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Realistic:</strong> something an officer/professional would notice</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-medium">Example:</p>
                  <p className="text-sm italic">"While taking rounds, he saw an opportunity to develop a riverfront above the Imphal river between villages of Kanakpur and Thomba"</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: HOW */}
            <Card className="mb-4 border-2 border-orange-300">
              <CardContent className="pt-6">
                <h4 className="font-bold text-lg mb-3 text-orange-700">STEP 3: HOW? (Actions - MOST IMPORTANT) ⚠️</h4>
                <p className="text-sm font-semibold mb-3 text-orange-800">
                  This is where you WIN or LOSE. Write minimum 5-6 specific actions!
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span><strong>WHO contacted:</strong> forest department, district collector, contractors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span><strong>WHAT permissions:</strong> tender floated, approvals sought</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span><strong>WHAT resources:</strong> materials, workers, budget</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span><strong>WHAT features:</strong> ferry services, bungee jumping, cycling lane, dustbins every 20 meters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span><strong>WHAT timeline:</strong> completed in 3 months, kept free for 1 month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span><strong>HOW supervised:</strong> personally monitored, conducted safety checks</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="text-sm font-medium">Example:</p>
                  <p className="text-sm italic">"He called a meeting with forest department officials for permission, floated tenders and talked with contractors, set maximum time limits, planned ferry services, bungee jumping, food stalls, separate cycling lane, and placed dustbins after every 20 meters"</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: SO WHAT */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <h4 className="font-bold text-lg mb-3 text-purple-700">STEP 4: SO WHAT? (Outcome)</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Clear positive result</strong> - what changed?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Who benefited:</strong> people, students, villagers, community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Add numbers:</strong> from 2 hours to 15 minutes, cost 15 lakhs</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-purple-50 rounded">
                  <p className="text-sm font-medium">Example:</p>
                  <p className="text-sm italic">"He kept it free for a month for maintenance, then put a ticket. People came in huge numbers and enjoyed the riverfront and scenic beauty"</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DO's and DON'Ts */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  DO's
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>✅ Use REAL Indian names - Rahul, Amit, Priya, Vikram</li>
                  <li>✅ Be SPECIFIC with numbers - 20 meters, 3 months, 15 lakhs</li>
                  <li>✅ Name exact places - Thoubal district Manipur, Imphal river</li>
                  <li>✅ Show ACTION - "He called", "He arranged", "He supervised"</li>
                  <li>✅ Mention authorities - district collector, forest department</li>
                  <li>✅ Give 5-6 detailed steps minimum</li>
                  <li>✅ Make it REALISTIC - something that can actually happen</li>
                  <li>✅ Keep positive mood - cheerful, determined, focused</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  DON'Ts
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>❌ Vague actions - "He tried hard and succeeded"</li>
                  <li>❌ Generic statements - "He worked with dedication"</li>
                  <li>❌ Negative themes - crime, violence, accidents, death</li>
                  <li>❌ Superhero actions - "He single-handedly lifted the car"</li>
                  <li>❌ Overthinking - write what you SEE in 30 seconds</li>
                  <li>❌ Too long - maximum 100-110 words</li>
                  <li>❌ Copy movie plots - be original and practical</li>
                  <li>❌ Romance or personal relationships</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Word Count Guide */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Word Count Guide
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>Line 1 (Character):</strong> 10-15 words</p>
                <p><strong>Line 2-3 (Problem):</strong> 15-20 words</p>
                <p className="text-orange-700 font-semibold"><strong>Line 4-7 (Actions):</strong> 50-60 words ← MOST IMPORTANT</p>
                <p><strong>Line 8-9 (Outcome):</strong> 15-20 words</p>
                <p className="mt-2 font-semibold">Total: 90-115 words maximum</p>
              </div>
            </CardContent>
          </Card>

          {/* Safe Themes */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-bold text-lg mb-3">Safe High-Scoring Themes</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>• Infrastructure (bridges, roads, community centers)</div>
                <div>• Social welfare (education, healthcare, sanitation)</div>
                <div>• Disaster management (flood relief, rescue)</div>
                <div>• Government/Administration (SDM solving issues)</div>
                <div>• Innovation/Development (new technology)</div>
                <div>• Environmental (plantation, river cleaning)</div>
                <div>• Youth/Sports (organizing competitions)</div>
                <div>• Public safety (traffic management)</div>
              </div>
            </CardContent>
          </Card>

          {/* Final Tip */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300">
            <CardContent className="pt-6">
              <h4 className="font-bold text-lg mb-2">💡 The Psychologist Checks:</h4>
              <ul className="space-y-1 text-sm">
                <li>✓ Can you <strong>PLAN?</strong> (Multiple specific steps)</li>
                <li>✓ Can you <strong>ORGANIZE?</strong> (Departments, resources, timeline)</li>
                <li>✓ Can you <strong>EXECUTE?</strong> (Concrete actions, not just thoughts)</li>
                <li>✓ Do you think about <strong>SOCIETY?</strong> (Helping people, development)</li>
                <li>✓ Are you <strong>PRACTICAL?</strong> (Realistic solutions)</li>
              </ul>
              <p className="mt-3 text-sm font-semibold text-blue-900">
                Show these qualities through SPECIFIC DETAILS - names, places, numbers, actions, departments, timelines, outcomes.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
