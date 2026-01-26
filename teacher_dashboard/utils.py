import time
import requests
import concurrent.futures
from typing import List, Dict, Any
from django.conf import settings

class Judge0Client:
 
 def __init__(self, base_url="https://judge0-ce.p.rapidapi.com"):
     # self.base_url = "http://localhost:2358"
     
     self.base_url = base_url
     self.headers = {
         "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
         "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
         "Content-Type": "application/json"
     }
     
     self.language_id = {
         'Python': 71,
         'Java': 62,
         'PHP': 68
     }
     
     
 def validate_solution(self, language: str, source_code: str, test_cases: List[Dict]) -> Dict[str, Any]:
 
     endpoint = f"{self.base_url}/submissions/batch?base64_encoded=false"
 
     submissions = []
     for test_case in test_cases:
         stdin = test_case['input_data'].replace(' ', '\n')
         submission = {
         "language_id": self.language_id.get(language),
         "source_code": source_code,
         "stdin": stdin,
         "expected_output": test_case['expected_output']
         }   
         submissions.append(submission)
 
     try:
    
         headers = self.headers
     
         response = requests.post(endpoint, json={"submissions": submissions}, headers=headers)
         response.raise_for_status()
         tokens = response.json()

         test_results = []
         all_passed = True

         with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:

             future_to_idx = {
                 executor.submit(self._get_submission_result, submission.get('token')): idx 
                 for idx, submission in enumerate(tokens)
             }
             
             for future in concurrent.futures.as_completed(future_to_idx):
                 idx = future_to_idx[future]
                 token = tokens[idx].get('token')
                 
                 if not token:
                     return {'success': False, 'error': "Judge0 nu a returnat un token valid."}

                 result = future.result()
                 
                 print(result.get('status'))

                 if 'status' not in result:
                     return {'success': False, 'error': 'Raspuns invalid Judge0', 'details': 'Status lipseste'}

                 if result.get('status', {}).get('id') == 6: 
                     return {
                         'success': False,
                         'error': 'Compilation Error',
                         'details': result.get('compile_output') or result.get('message', 'No details available.')
                     }

                 if result.get('status', {}).get('id') in [11, 12]:  
                     return {
                         'success': False,
                         'error': 'Runtime Error',
                         'details': result.get('stderr') or result.get('message', 'No details available.')
                     }

                 is_correct = (result['status']['id'] == 3 and result.get('stdout', '').strip() == submissions[idx]['expected_output'].strip())

                 test_results.append({
                         'test_case_number': idx + 1,
                         'passed': is_correct,
                         'input': test_cases[idx]['input_data'],
                         'actual_output': result.get('stdout', ''),
                         'error': result.get('stderr', ''),
                         'status': result['status']['description']
                 })

                 if not is_correct:
                     all_passed = False

         test_results.sort(key=lambda x: x['test_case_number'])
         
         return {'success': all_passed, 'test_results': test_results}

     except requests.RequestException as e:
         return {'success': False, 'error': f"Nu s-a putut conecta la Judge0: {str(e)}"}
     
     except Exception as e:
         print(f"Eroare generala: {str(e)}")
         return {'success': False, 'error': f"Eroare in conectarea la Judge0: {str(e)}"}


 def _get_submission_result(self, token: str) -> Dict:

     if not token:
         return {"error": "Token invalid"}

     result_endpoint = f"{self.base_url}/submissions/{token}?base64_encoded=false"
     
     for _ in range(10):  
         try:

             response = requests.get(result_endpoint, headers=self.headers)
             response.raise_for_status()
             result = response.json()
             
             print("JUDGE0 RESPONSE:", result)
             
             if result.get('status', {}).get('id') in [1, 2]:  
                 time.sleep(1)
                 continue
             
             if 'status' not in result:
                 print("Judge0 nu a returnat un status valid. ")
                 time.sleep(1)
                 continue  
         
             return result
         except requests.RequestException:
             time.sleep(1)
     
     return {"error": "Nu s-a putut obtine rezultatul executiei."}