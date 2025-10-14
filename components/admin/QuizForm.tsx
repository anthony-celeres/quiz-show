import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, Trash2 } from 'lucide-react';

interface Question {
  question_text: string;
  options: string[];
  correct_answer: number;
  points: number;
}

interface QuizFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  quizToEdit?: Quiz;
}

export const QuizForm = ({ onSuccess, onCancel, quizToEdit }: QuizFormProps) => {
  const [title, setTitle] = useState(quizToEdit?.title || '');
  const [description, setDescription] = useState(quizToEdit?.description || '');
  const [duration, setDuration] = useState(quizToEdit?.duration_minutes || 30);
  const [questions, setQuestions] = useState<Question[]>(
    quizToEdit?.questions && quizToEdit.questions.length > 0
      ? quizToEdit.questions.map(q => ({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
        }))
      : [
          {
            question_text: '',
            options: ['', '', '', ''],
            correct_answer: 0,
            points: 1,
          },
        ]
  );
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        points: 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

      let quiz: any;
      
      if (quizToEdit) {
        // Update existing quiz
        const { data: updatedQuiz, error: quizError } = await supabase
          .from('quizzes')
          .update({
            title,
            description,
            duration_minutes: duration,
            total_points: totalPoints,
          })
          .eq('id', quizToEdit.id)
          .select()
          .single();

        if (quizError) throw quizError;
        quiz = updatedQuiz;

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('quiz_id', quizToEdit.id);

        if (deleteError) throw deleteError;
      } else {
        // Create new quiz
        const { data: newQuiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            title,
            description,
            duration_minutes: duration,
            total_points: totalPoints,
            created_by: user.user.id,
          })
          .select()
          .single();

        if (quizError) throw quizError;
        quiz = newQuiz;
      }

      // Create/Update questions
      const questionsToInsert = questions.map((q) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      onSuccess();
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto modern-card p-8 fade-in">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
          <Plus className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold gradient-text mb-4">
          {quizToEdit ? 'Edit Quiz' : 'Create New Quiz'}
        </h2>
        <p className="text-gray-600 text-lg">
          {quizToEdit ? 'Update quiz details and questions' : 'Design engaging quizzes for your students'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz title</Label>
            <Input
              id="quiz-title"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-duration">Duration (minutes)</Label>
            <Input
              id="quiz-duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quiz-description">Description</Label>
          <textarea
            id="quiz-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={4}
            placeholder="Describe what this quiz covers..."
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Questions</h3>
              <p className="text-gray-600">Add questions to your quiz</p>
            </div>
            <Button type="button" onClick={addQuestion} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Question
            </Button>
          </div>
          
          <div className="space-y-8">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="modern-card p-8 group hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{questionIndex + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Question {questionIndex + 1}</h4>
                      <p className="text-gray-600">Configure this question</p>
                    </div>
                  </div>
                  {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${questionIndex}-text`}>Question text</Label>
                    <Input
                      id={`question-${questionIndex}-text`}
                      placeholder="Enter your question here..."
                      value={question.question_text}
                      onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-4 block" htmlFor={`question-${questionIndex}-option-0`}>
                      Answer options
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="relative">
                          <Input
                            id={`question-${questionIndex}-option-${optionIndex}`}
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                            required
                            className={question.correct_answer === optionIndex ? 'border-green-500 bg-green-50' : ''}
                          />
                          {question.correct_answer === optionIndex && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${questionIndex}-correct`}>Correct answer</Label>
                      <select
                        id={`question-${questionIndex}-correct`}
                        value={question.correct_answer}
                        onChange={(e) => updateQuestion(questionIndex, 'correct_answer', Number(e.target.value))}
                        className="modern-input"
                      >
                        {question.options.map((_, optionIndex) => (
                          <option key={optionIndex} value={optionIndex}>
                            Option {optionIndex + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`question-${questionIndex}-points`}>Points</Label>
                      <Input
                        id={`question-${questionIndex}-points`}
                        type="number"
                        placeholder="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(questionIndex, 'points', Number(e.target.value))}
                        min={1}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
          <Button 
            type="submit" 
            disabled={loading}
            loading={loading}
            size="lg"
            className="flex-1 sm:flex-none"
          >
            {loading ? (quizToEdit ? 'Updating Quiz...' : 'Creating Quiz...') : (quizToEdit ? 'Update Quiz' : 'Create Quiz')}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            size="lg"
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};