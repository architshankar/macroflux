// import React, { useState, useRef } from 'react';
// import { FileJson, UploadCloud, Check, AlertTriangle, Plus, Trash2, Edit3, Save, ChevronDown, ChevronRight, X } from 'lucide-react';
// import { uploadProgramMigration } from '../adminService';

// interface ProgramUploaderProps {
//   showToast: (msg: string) => void;
// }

// export function ProgramUploader({ showToast }: ProgramUploaderProps) {
//   const [jsonText, setJsonText] = useState('');
//   const [parsedData, setParsedData] = useState<any>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       try {
//         const text = event.target?.result as string;
//         setJsonText(text);
//         const data = JSON.parse(text);
//         setParsedData(data);
//         setErrorMessage('');
//         setSuccessMessage('');
//         setUploadProgress([]);
//       } catch (err: any) {
//         setErrorMessage(`Invalid JSON in file: ${err.message}`);
//         setParsedData(null);
//       }
//     };
//     reader.readAsText(file);
//   };

//   const handleTextParse = () => {
//     try {
//       const data = JSON.parse(jsonText);
//       setParsedData(data);
//       setErrorMessage('');
//       setSuccessMessage('');
//       setUploadProgress([]);
//     } catch (err: any) {
//       setErrorMessage(`Invalid JSON: ${err.message}`);
//       setParsedData(null);
//     }
//   };

//   const handleFinalUpload = async () => {
//     if (!parsedData) return;
//     setIsUploading(true);
//     setErrorMessage('');
//     setUploadProgress([]);
//     setSuccessMessage('');

//     const logProgress = (msg: string) => {
//       setUploadProgress(prev => [...prev, msg]);
//     };

//     try {
//       await uploadProgramMigration(parsedData, logProgress);
//       setSuccessMessage('Program successfully migrated to the database!');
//       showToast('Program deployed successfully to backend.');
//     } catch (err: any) {
//       setErrorMessage(err.message || 'Upload failed');
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   // State mutators for nested structure
//   const updateProgramField = (field: string, value: any) => {
//     setParsedData({ ...parsedData, [field]: value });
//   };

//   const updateWeekField = (weekIndex: number, field: string, value: any) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     updatedWeeks[weekIndex] = { ...updatedWeeks[weekIndex], [field]: value };
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   const addWeek = () => {
//     const newWeek = {
//       week: (parsedData.weeks?.length || 0) + 1,
//       block: 1,
//       block_label: 'New Block',
//       is_deload: false,
//       sessions: []
//     };
//     setParsedData({ ...parsedData, weeks: [...(parsedData.weeks || []), newWeek], total_weeks: (parsedData.weeks?.length || 0) + 1 });
//   };

//   const removeWeek = (weekIndex: number) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     updatedWeeks.splice(weekIndex, 1);
//     setParsedData({ ...parsedData, weeks: updatedWeeks, total_weeks: updatedWeeks.length });
//   };

//   const updateSessionField = (weekIndex: number, sessionIndex: number, field: string, value: any) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
//     updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], [field]: value };
//     updatedWeeks[weekIndex].sessions = updatedSessions;
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   const addSession = (weekIndex: number) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     const sessions = updatedWeeks[weekIndex].sessions || [];
//     sessions.push({
//       session_number: sessions.length + 1,
//       session_label: 'New Session',
//       exercises: []
//     });
//     updatedWeeks[weekIndex].sessions = sessions;
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   const removeSession = (weekIndex: number, sessionIndex: number) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     const sessions = [...(updatedWeeks[weekIndex].sessions || [])];
//     sessions.splice(sessionIndex, 1);
//     updatedWeeks[weekIndex].sessions = sessions;
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   const updateExerciseField = (weekIndex: number, sessionIndex: number, exerciseIndex: number, field: string, value: any) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
//     const updatedExercises = [...(updatedSessions[sessionIndex].exercises || [])];
//     updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], [field]: value };
//     updatedSessions[sessionIndex].exercises = updatedExercises;
//     updatedWeeks[weekIndex].sessions = updatedSessions;
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   const addExercise = (weekIndex: number, sessionIndex: number) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
//     const exercises = updatedSessions[sessionIndex].exercises || [];
//     exercises.push({
//       name: 'New Exercise',
//       tutorial_url: null,
//       warm_up_sets: 0,
//       working_sets: 3,
//       target_reps: '8-12',
//       early_set_rpe: null,
//       last_set_rpe: 8,
//       rest: '90s',
//       intensity_technique: null,
//       notes: '',
//       substitutions: []
//     });
//     updatedSessions[sessionIndex].exercises = exercises;
//     updatedWeeks[weekIndex].sessions = updatedSessions;
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   const removeExercise = (weekIndex: number, sessionIndex: number, exerciseIndex: number) => {
//     const updatedWeeks = [...(parsedData.weeks || [])];
//     const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
//     const exercises = [...(updatedSessions[sessionIndex].exercises || [])];
//     exercises.splice(exerciseIndex, 1);
//     updatedSessions[sessionIndex].exercises = exercises;
//     updatedWeeks[weekIndex].sessions = updatedSessions;
//     setParsedData({ ...parsedData, weeks: updatedWeeks });
//   };

//   return (
//     <div className="space-y-6">
      
//       {/* HEADER */}
//       <div>
//         <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
//           <UploadCloud className="w-5 h-5 text-[#CCFF00]" /> Program Content Importer
//         </h2>
//         <p className="text-[#9A9A9A] text-sm mt-1">
//           Upload or paste JSON schema defining workout programs. View, edit, and push directly to Supabase.
//         </p>
//       </div>

//       {/* ERROR / SUCCESS ALERTS */}
//       {errorMessage && (
//         <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-start gap-3">
//           <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
//           <div className="text-sm font-mono whitespace-pre-wrap">{errorMessage}</div>
//         </div>
//       )}
      
//       {successMessage && (
//         <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/50 text-[#CCFF00] p-4 rounded-lg flex items-start gap-3">
//           <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
//           <div className="font-mono text-sm">
//             <p className="font-bold mb-1">{successMessage}</p>
//             <div className="text-xs space-y-1 mt-2 text-[#9A9A9A]">
//               {uploadProgress.map((msg, i) => (
//                 <div key={i}>{msg}</div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* INPUT AREA */}
//       {!parsedData && (
//         <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4">
//           <div className="flex justify-between items-center">
//             <h3 className="text-white font-mono text-sm font-semibold">Provide JSON Data</h3>
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="bg-[#202020] hover:bg-[#2a2a2a] text-[#CCFF00] border border-[#333] px-4 py-2 rounded text-xs font-mono transition-colors flex items-center gap-2"
//             >
//               <FileJson className="w-4 h-4" /> Select JSON File
//             </button>
//             <input
//               type="file"
//               accept=".json"
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               className="hidden"
//             />
//           </div>
          
//           <div className="relative">
//             <textarea
//               value={jsonText}
//               onChange={(e) => setJsonText(e.target.value)}
//               placeholder="Paste your JSON program structure here..."
//               className="w-full h-64 bg-[#0A0A0A] border border-[#252525] hover:border-zinc-700 focus:border-[#CCFF00] rounded-lg p-4 font-mono text-xs text-white resize-y outline-none transition-colors"
//             />
//           </div>
          
//           <button
//             onClick={handleTextParse}
//             disabled={!jsonText.trim()}
//             className="w-full bg-[#CCFF00] text-black font-bold font-mono py-3 rounded-lg hover:bg-[#b3ff00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//           >
//             Parse & Validate JSON
//           </button>
//         </div>
//       )}

//       {/* PREVIEW AND EDIT STATE */}
//       {parsedData && (
//         <div className="space-y-6">
//           <div className="flex items-center justify-between bg-[#141414] border border-[#252525] p-4 rounded-xl sticky top-20 z-10 shadow-xl">
//             <div className="flex gap-4">
//               <button 
//                 onClick={() => setParsedData(null)}
//                 className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 px-3 py-1.5 rounded"
//               >
//                 Clear / Start Over
//               </button>
//               <button 
//                 onClick={addWeek}
//                 className="text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 bg-[#202020] border border-[#303030] px-3 py-1.5 rounded"
//               >
//                 <Plus className="w-3 h-3" /> Add Week
//               </button>
//             </div>
            
//             <button
//               onClick={handleFinalUpload}
//               disabled={isUploading}
//               className="bg-[#CCFF00] text-black font-bold font-mono px-6 py-2 rounded-lg hover:bg-[#b3ff00] disabled:opacity-50 flex items-center gap-2"
//             >
//               {isUploading ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
//                   Uploading...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4" /> Confirm & Post to Supabase
//                 </>
//               )}
//             </button>
//           </div>

//           <div className="bg-[#141414] border border-[#252525] rounded-xl p-6">
//             <h3 className="text-zinc-500 font-mono text-xs mb-4 uppercase tracking-wider">Program Envelope</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-[10px] text-zinc-400 font-mono mb-1">Program Name</label>
//                 <input 
//                   type="text" 
//                   value={parsedData.program_name || ''} 
//                   onChange={(e) => updateProgramField('program_name', e.target.value)}
//                   className="w-full bg-[#0A0A0A] border border-[#252525] rounded p-2 text-sm text-white font-mono outline-none focus:border-[#CCFF00]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-[10px] text-zinc-400 font-mono mb-1">Cycle Note / Description</label>
//                 <input 
//                   type="text" 
//                   value={parsedData.cycle_note || ''} 
//                   onChange={(e) => updateProgramField('cycle_note', e.target.value)}
//                   className="w-full bg-[#0A0A0A] border border-[#252525] rounded p-2 text-sm text-white font-mono outline-none focus:border-[#CCFF00]"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* WEEKS ITERATION */}
//           <div className="space-y-4">
//             {(parsedData.weeks || []).map((week: any, wIndex: number) => (
//               <div key={wIndex} className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden hover:border-[#333] transition-colors">
                
//                 <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#252525]">
//                   <div className="flex gap-4">
//                     <div>
//                       <span className="text-[10px] text-zinc-500 font-mono block">Week #</span>
//                       <input 
//                         type="number" 
//                         value={week.week || ''} 
//                         onChange={(e) => updateWeekField(wIndex, 'week', parseInt(e.target.value) || 0)}
//                         className="w-16 bg-[#0A0A0A] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono text-center"
//                       />
//                     </div>
//                     <div>
//                       <span className="text-[10px] text-zinc-500 font-mono block">Block Label</span>
//                       <input 
//                         type="text" 
//                         value={week.block_label || ''} 
//                         onChange={(e) => updateWeekField(wIndex, 'block_label', e.target.value)}
//                         className="w-32 bg-[#0A0A0A] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <button 
//                       onClick={() => addSession(wIndex)}
//                       className="text-[10px] uppercase font-mono text-[#CCFF00] hover:bg-[#CCFF00]/10 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-[#CCFF00]/30"
//                     >
//                       <Plus className="w-3 h-3" /> Session
//                     </button>
//                     <button 
//                       onClick={() => removeWeek(wIndex)}
//                       className="text-red-500 hover:text-red-400 p-1"
//                       title="Remove Week"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* SESSIONS ITERATION */}
//                 <div className="p-4 space-y-4">
//                   {(week.sessions || []).length === 0 && (
//                     <div className="text-zinc-600 text-xs font-mono text-center py-4">No sessions in this week</div>
//                   )}
//                   {(week.sessions || []).map((session: any, sIndex: number) => (
//                     <div key={sIndex} className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg">
//                       <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] bg-[#111]">
//                         <div className="flex items-center gap-3">
//                           <input 
//                             type="number" 
//                             value={session.session_number || ''} 
//                             onChange={(e) => updateSessionField(wIndex, sIndex, 'session_number', parseInt(e.target.value) || 0)}
//                             className="w-12 bg-black border border-[#333] rounded px-1 text-xs text-white font-mono text-center"
//                           />
//                           <input 
//                             type="text" 
//                             value={session.session_label || ''} 
//                             placeholder="Session Label"
//                             onChange={(e) => updateSessionField(wIndex, sIndex, 'session_label', e.target.value)}
//                             className="bg-black border border-[#333] rounded px-2 text-xs text-[#CCFF00] font-mono outline-none focus:border-[#CCFF00]"
//                           />
//                         </div>
//                         <div className="flex gap-2">
//                           <button 
//                             onClick={() => addExercise(wIndex, sIndex)}
//                             className="text-[10px] bg-[#222] hover:bg-[#333] text-white px-2 py-1 rounded border border-[#444] flex items-center gap-1 font-mono"
//                           >
//                             <Plus className="w-3 h-3" /> Ex
//                           </button>
//                           <button 
//                             onClick={() => removeSession(wIndex, sIndex)}
//                             className="text-zinc-500 hover:text-red-500 p-1"
//                           >
//                             <X className="w-3 h-3" />
//                           </button>
//                         </div>
//                       </div>

//                       {/* EXERCISES ITERATION */}
//                       <div className="divide-y divide-[#1e1e1e]">
//                         {(session.exercises || []).map((ex: any, exIndex: number) => (
//                           <div key={exIndex} className="p-3 hover:bg-[#111] transition-colors flex flex-col md:flex-row gap-3">
//                             <div className="flex-1 space-y-2">
//                               <div>
//                                 <input 
//                                   type="text" 
//                                   value={ex.name || ''} 
//                                   onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'name', e.target.value)}
//                                   className="w-full bg-black border border-[#333] rounded px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#CCFF00]"
//                                   placeholder="Exercise Name"
//                                 />
//                               </div>
//                               <div className="flex flex-wrap gap-2">
//                                 <div className="flex items-center gap-1">
//                                   <span className="text-[9px] text-zinc-500 font-mono">WarmUp Sets:</span>
//                                   <input 
//                                     type="number" 
//                                     value={ex.warm_up_sets ?? ''} 
//                                     onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'warm_up_sets', parseInt(e.target.value) || 0)}
//                                     className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
//                                   />
//                                 </div>
//                                 <div className="flex items-center gap-1">
//                                   <span className="text-[9px] text-zinc-500 font-mono">Working Sets:</span>
//                                   <input 
//                                     type="number" 
//                                     value={ex.working_sets ?? ''} 
//                                     onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'working_sets', parseInt(e.target.value) || 0)}
//                                     className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
//                                   />
//                                 </div>
//                                 <div className="flex items-center gap-1">
//                                   <span className="text-[9px] text-zinc-500 font-mono">Reps:</span>
//                                   <input 
//                                     type="text" 
//                                     value={ex.target_reps || ''} 
//                                     onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'target_reps', e.target.value)}
//                                     className="w-16 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
//                                   />
//                                 </div>
//                                 <div className="flex items-center gap-1">
//                                   <span className="text-[9px] text-zinc-500 font-mono">Rest:</span>
//                                   <input 
//                                     type="text" 
//                                     value={ex.rest || ''} 
//                                     onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'rest', e.target.value)}
//                                     className="w-16 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="md:w-10 flex items-center justify-center border-t md:border-t-0 md:border-l border-[#222] pt-2 md:pt-0 pl-0 md:pl-2">
//                               <button 
//                                 onClick={() => removeExercise(wIndex, sIndex, exIndex)}
//                                 className="text-zinc-600 hover:text-red-500 p-2 rounded hover:bg-[#222]"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </div>
//                         ))}
//                         {(session.exercises || []).length === 0 && (
//                           <div className="text-zinc-600 text-[10px] font-mono p-2">No exercises configured.</div>
//                         )}
//                       </div>

//                     </div>
//                   ))}
//                 </div>

//               </div>
//             ))}
//           </div>

//         </div>
//       )}
//     </div>
//   );
// }

































import React, { useState, useRef } from 'react';
import { FileJson, UploadCloud, Check, AlertTriangle, Plus, Trash2, Edit3, Save, ChevronDown, ChevronUp, ChevronRight, X } from 'lucide-react';
import { uploadProgramMigration } from '../adminService';

interface ProgramUploaderProps {
  showToast: (msg: string) => void;
}

export function ProgramUploader({ showToast }: ProgramUploaderProps) {
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonText(text);
        const data = JSON.parse(text);
        setParsedData(data);
        setErrorMessage('');
        setSuccessMessage('');
        setUploadProgress([]);
      } catch (err: any) {
        setErrorMessage(`Invalid JSON in file: ${err.message}`);
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleTextParse = () => {
    try {
      const data = JSON.parse(jsonText);
      setParsedData(data);
      setErrorMessage('');
      setSuccessMessage('');
      setUploadProgress([]);
    } catch (err: any) {
      setErrorMessage(`Invalid JSON: ${err.message}`);
      setParsedData(null);
    }
  };

  const handleFinalUpload = async () => {
    if (!parsedData) return;
    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress([]);
    setSuccessMessage('');

    const logProgress = (msg: string) => {
      setUploadProgress(prev => [...prev, msg]);
    };

    try {
      await uploadProgramMigration(parsedData, logProgress);
      setSuccessMessage('Program successfully migrated to the database!');
      showToast('Program deployed successfully to backend.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // State mutators for nested structure
  const updateProgramField = (field: string, value: any) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  const updateWeekField = (weekIndex: number, field: string, value: any) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    updatedWeeks[weekIndex] = { ...updatedWeeks[weekIndex], [field]: value };
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  const addWeek = () => {
    const newWeek = {
      week: (parsedData.weeks?.length || 0) + 1,
      block: 1,
      block_label: 'New Block',
      is_deload: false,
      sessions: []
    };
    setParsedData({ ...parsedData, weeks: [...(parsedData.weeks || []), newWeek], total_weeks: (parsedData.weeks?.length || 0) + 1 });
  };

  const removeWeek = (weekIndex: number) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    updatedWeeks.splice(weekIndex, 1);
    setParsedData({ ...parsedData, weeks: updatedWeeks, total_weeks: updatedWeeks.length });
  };

  const updateSessionField = (weekIndex: number, sessionIndex: number, field: string, value: any) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
    updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], [field]: value };
    updatedWeeks[weekIndex].sessions = updatedSessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  const addSession = (weekIndex: number) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const sessions = updatedWeeks[weekIndex].sessions || [];
    sessions.push({
      session_number: sessions.length + 1,
      session_label: 'New Session',
      exercises: []
    });
    updatedWeeks[weekIndex].sessions = sessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  const removeSession = (weekIndex: number, sessionIndex: number) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const sessions = [...(updatedWeeks[weekIndex].sessions || [])];
    sessions.splice(sessionIndex, 1);
    updatedWeeks[weekIndex].sessions = sessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  // Mutator to shift ordering index positions of sessions/days up or down
  const moveSession = (weekIndex: number, sessionIndex: number, direction: 'up' | 'down') => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const sessions = [...(updatedWeeks[weekIndex].sessions || [])];
    
    const targetIndex = direction === 'up' ? sessionIndex - 1 : sessionIndex + 1;
    
    // Boundary check safety guard
    if (targetIndex < 0 || targetIndex >= sessions.length) return;
    
    // Swap the sessions
    const temp = sessions[sessionIndex];
    sessions[sessionIndex] = sessions[targetIndex];
    sessions[targetIndex] = temp;
    
    // Optional: Auto-correct the session numbers sequentially after swapping if desired. 
    // Comment out the next two lines if your original file contains explicit semantic numbers you want to preserve.
    sessions[sessionIndex].session_number = sessionIndex + 1;
    sessions[targetIndex].session_number = targetIndex + 1;

    updatedWeeks[weekIndex].sessions = sessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  const updateExerciseField = (weekIndex: number, sessionIndex: number, exerciseIndex: number, field: string, value: any) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
    const updatedExercises = [...(updatedSessions[sessionIndex].exercises || [])];
    updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], [field]: value };
    updatedSessions[sessionIndex].exercises = updatedExercises;
    updatedWeeks[weekIndex].sessions = updatedSessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  const addExercise = (weekIndex: number, sessionIndex: number) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
    const exercises = updatedSessions[sessionIndex].exercises || [];
    exercises.push({
      name: 'New Exercise',
      tutorial_url: null,
      warm_up_sets: 0,
      working_sets: 3,
      target_reps: '8-12',
      early_set_rpe: null,
      last_set_rpe: 8,
      rest: '90s',
      intensity_technique: null,
      notes: '',
      substitutions: []
    });
    updatedSessions[sessionIndex].exercises = exercises;
    updatedWeeks[weekIndex].sessions = updatedSessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  const removeExercise = (weekIndex: number, sessionIndex: number, exerciseIndex: number) => {
    const updatedWeeks = [...(parsedData.weeks || [])];
    const updatedSessions = [...(updatedWeeks[weekIndex].sessions || [])];
    const exercises = [...(updatedSessions[sessionIndex].exercises || [])];
    exercises.splice(exerciseIndex, 1);
    updatedSessions[sessionIndex].exercises = exercises;
    updatedWeeks[weekIndex].sessions = updatedSessions;
    setParsedData({ ...parsedData, weeks: updatedWeeks });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#CCFF00]" /> Program Content Importer
        </h2>
        <p className="text-[#9A9A9A] text-sm mt-1">
          Upload or paste JSON schema defining workout programs. View, edit, and push directly to Supabase.
        </p>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-mono whitespace-pre-wrap">{errorMessage}</div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/50 text-[#CCFF00] p-4 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="font-mono text-sm">
            <p className="font-bold mb-1">{successMessage}</p>
            <div className="text-xs space-y-1 mt-2 text-[#9A9A9A]">
              {uploadProgress.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      {!parsedData && (
        <div className="bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-mono text-sm font-semibold">Provide JSON Data</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#202020] hover:bg-[#2a2a2a] text-[#CCFF00] border border-[#333] px-4 py-2 rounded text-xs font-mono transition-colors flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" /> Select JSON File
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          <div className="relative">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste your JSON program structure here..."
              className="w-full h-64 bg-[#0A0A0A] border border-[#252525] hover:border-zinc-700 focus:border-[#CCFF00] rounded-lg p-4 font-mono text-xs text-white resize-y outline-none transition-colors"
            />
          </div>
          
          <button
            onClick={handleTextParse}
            disabled={!jsonText.trim()}
            className="w-full bg-[#CCFF00] text-black font-bold font-mono py-3 rounded-lg hover:bg-[#b3ff00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Parse & Validate JSON
          </button>
        </div>
      )}

      {/* PREVIEW AND EDIT STATE */}
      {parsedData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#141414] border border-[#252525] p-4 rounded-xl sticky top-20 z-10 shadow-xl">
            <div className="flex gap-4">
              <button 
                onClick={() => setParsedData(null)}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 px-3 py-1.5 rounded"
              >
                Clear / Start Over
              </button>
              <button 
                onClick={addWeek}
                className="text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 bg-[#202020] border border-[#303030] px-3 py-1.5 rounded"
              >
                <Plus className="w-3 h-3" /> Add Week
              </button>
            </div>
            
            <button
              onClick={handleFinalUpload}
              disabled={isUploading}
              className="bg-[#CCFF00] text-black font-bold font-mono px-6 py-2 rounded-lg hover:bg-[#b3ff00] disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Confirm & Post to Supabase
                </>
              )}
            </button>
          </div>

          <div className="bg-[#141414] border border-[#252525] rounded-xl p-6">
            <h3 className="text-zinc-500 font-mono text-xs mb-4 uppercase tracking-wider">Program Envelope</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-400 font-mono mb-1">Program Name</label>
                <input 
                  type="text" 
                  value={parsedData.program_name || ''} 
                  onChange={(e) => updateProgramField('program_name', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#252525] rounded p-2 text-sm text-white font-mono outline-none focus:border-[#CCFF00]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 font-mono mb-1">Cycle Note / Description</label>
                <input 
                  type="text" 
                  value={parsedData.cycle_note || ''} 
                  onChange={(e) => updateProgramField('cycle_note', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#252525] rounded p-2 text-sm text-white font-mono outline-none focus:border-[#CCFF00]"
                />
              </div>
            </div>
          </div>

          {/* WEEKS ITERATION */}
          <div className="space-y-4">
            {(parsedData.weeks || []).map((week: any, wIndex: number) => (
              <div key={wIndex} className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden hover:border-[#333] transition-colors">
                
                <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#252525]">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">Week #</span>
                      <input 
                        type="number" 
                        value={week.week || ''} 
                        onChange={(e) => updateWeekField(wIndex, 'week', parseInt(e.target.value) || 0)}
                        className="w-16 bg-[#0A0A0A] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">Block Label</span>
                      <input 
                        type="text" 
                        value={week.block_label || ''} 
                        onChange={(e) => updateWeekField(wIndex, 'block_label', e.target.value)}
                        className="w-32 bg-[#0A0A0A] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => addSession(wIndex)}
                      className="text-[10px] uppercase font-mono text-[#CCFF00] hover:bg-[#CCFF00]/10 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-[#CCFF00]/30"
                    >
                      <Plus className="w-3 h-3" /> Session
                    </button>
                    <button 
                      onClick={() => removeWeek(wIndex)}
                      className="text-red-500 hover:text-red-400 p-1"
                      title="Remove Week"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SESSIONS ITERATION */}
                <div className="p-4 space-y-4">
                  {(week.sessions || []).length === 0 && (
                    <div className="text-zinc-600 text-xs font-mono text-center py-4">No sessions in this week</div>
                  )}
                  {(week.sessions || []).map((session: any, sIndex: number) => (
                    <div key={sIndex} className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg">
                      <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] bg-[#111]">
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            value={session.session_number || ''} 
                            onChange={(e) => updateSessionField(wIndex, sIndex, 'session_number', parseInt(e.target.value) || 0)}
                            className="w-12 bg-black border border-[#333] rounded px-1 text-xs text-white font-mono text-center"
                          />
                          <input 
                            type="text" 
                            value={session.session_label || ''} 
                            placeholder="Session Label"
                            onChange={(e) => updateSessionField(wIndex, sIndex, 'session_label', e.target.value)}
                            className="bg-black border border-[#333] rounded px-2 text-xs text-[#CCFF00] font-mono outline-none focus:border-[#CCFF00]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {/* DAY / SESSION ORDER CONTROLS */}
                          <div className="flex items-center bg-[#181818] border border-[#2a2a2a] rounded px-1 gap-0.5 mr-2">
                            <button
                              onClick={() => moveSession(wIndex, sIndex, 'up')}
                              disabled={sIndex === 0}
                              className="text-zinc-500 hover:text-[#CCFF00] p-1 disabled:opacity-20 transition-colors"
                              title="Move Day Up"
                            >
                              <ChevronUp className="w-3 (h-3)" size={14} />
                            </button>
                            <button
                              onClick={() => moveSession(wIndex, sIndex, 'down')}
                              disabled={sIndex === (week.sessions.length - 1)}
                              className="text-zinc-500 hover:text-[#CCFF00] p-1 disabled:opacity-20 transition-colors"
                              title="Move Day Down"
                            >
                              <ChevronDown className="w-3 (h-3)" size={14} />
                            </button>
                          </div>

                          <button 
                            onClick={() => addExercise(wIndex, sIndex)}
                            className="text-[10px] bg-[#222] hover:bg-[#333] text-white px-2 py-1 rounded border border-[#444] flex items-center gap-1 font-mono"
                          >
                            <Plus className="w-3 h-3" /> Ex
                          </button>
                          <button 
                            onClick={() => removeSession(wIndex, sIndex)}
                            className="text-zinc-500 hover:text-red-500 p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* EXERCISES ITERATION */}
                      <div className="divide-y divide-[#1e1e1e]">
                        {(session.exercises || []).map((ex: any, exIndex: number) => (
                          <div key={exIndex} className="p-3 hover:bg-[#111] transition-colors flex flex-col md:flex-row gap-3">
                            <div className="flex-1 space-y-2">
                              <div>
                                <input 
                                  type="text" 
                                  value={ex.name || ''} 
                                  onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'name', e.target.value)}
                                  className="w-full bg-black border border-[#333] rounded px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#CCFF00]"
                                  placeholder="Exercise Name"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-zinc-500 font-mono">WarmUp Sets:</span>
                                  <input 
                                    type="number" 
                                    value={ex.warm_up_sets ?? ''} 
                                    onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'warm_up_sets', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-zinc-500 font-mono">Working Sets:</span>
                                  <input 
                                    type="number" 
                                    value={ex.working_sets ?? ''} 
                                    onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'working_sets', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-zinc-500 font-mono">Reps:</span>
                                  <input 
                                    type="text" 
                                    value={ex.target_reps || ''} 
                                    onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'target_reps', e.target.value)}
                                    className="w-16 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-zinc-500 font-mono">Rest:</span>
                                  <input 
                                    type="text" 
                                    value={ex.rest || ''} 
                                    onChange={(e) => updateExerciseField(wIndex, sIndex, exIndex, 'rest', e.target.value)}
                                    className="w-16 bg-[#222] rounded px-1 text-xs text-white border border-transparent focus:border-[#CCFF00]"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="md:w-10 flex items-center justify-center border-t md:border-t-0 md:border-l border-[#222] pt-2 md:pt-0 pl-0 md:pl-2">
                              <button 
                                onClick={() => removeExercise(wIndex, sIndex, exIndex)}
                                className="text-zinc-600 hover:text-red-500 p-2 rounded hover:bg-[#222]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(session.exercises || []).length === 0 && (
                          <div className="text-zinc-600 text-[10px] font-mono p-2">No exercises configured.</div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}