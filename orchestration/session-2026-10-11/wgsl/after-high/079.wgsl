// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform7_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform7 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform6 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform8 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : f32,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform18 : mat4x4<f32>,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform24 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec2<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : u32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : vec2<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : vec2<f32>;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec2<f32>;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : u32;
var<private> nodeVar33 : u32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : u32;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec2<f32>;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec2<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec2<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec2<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec2<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec2<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec2<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec2<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec2<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : u32;
var<private> nodeVar85 : u32;
var<private> nodeVar86 : u32;
var<private> nodeVar87 : u32;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec2<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec2<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar123 : vec3<f32>;
var<private> NORMAL_nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec2<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec2<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec4<f32>;
var<private> nodeVar146 : vec4<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec4<f32>;
var<private> nodeVar174 : vec4<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar178 : f32;
var<private> nodeVar179 : vec4<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : vec2<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : vec2<f32>;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : vec2<f32>;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : vec2<f32>;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : vec2<f32>;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : f32;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : f32;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : f32;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : vec3<f32>;
var<private> nodeVar278 : vec3<f32>;
var<private> nodeVar279 : vec3<f32>;
var<private> nodeVar280 : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> nodeVar282 : vec3<f32>;
var<private> nodeVar283 : vec3<f32>;
var<private> nodeVar284 : f32;
var<private> nodeVar285 : f32;
var<private> nodeVar286 : f32;
var<private> nodeVar287 : vec3<f32>;
var<private> nodeVar288 : vec3<f32>;
var<private> nodeVar289 : vec3<f32>;
var<private> nodeVar290 : vec3<f32>;
var<private> nodeVar291 : vec3<f32>;
var<private> nodeVar292 : vec3<f32>;
var<private> nodeVar293 : vec3<f32>;
var<private> nodeVar294 : f32;
var<private> nodeVar295 : vec3<f32>;
var<private> nodeVar296 : vec3<f32>;
var<private> nodeVar297 : vec3<f32>;
var<private> nodeVar298 : vec3<f32>;
var<private> nodeVar299 : vec3<f32>;
var<private> nodeVar300 : vec3<f32>;
var<private> nodeVar301 : vec3<f32>;
var<private> nodeVar302 : f32;
var<private> nodeVar303 : f32;
var<private> nodeVar304 : f32;
var<private> nodeVar305 : vec3<f32>;
var<private> nodeVar306 : vec3<f32>;
var<private> nodeVar307 : vec3<f32>;
var<private> nodeVar308 : vec3<f32>;
var<private> nodeVar309 : vec3<f32>;
var<private> nodeVar310 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar311 : vec3<f32>;
var<private> nodeVar312 : vec3<f32>;
var<private> nodeVar313 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar314 : vec3<f32>;
var<private> nodeVar315 : vec3<f32>;
var<private> nodeVar316 : vec3<f32>;
var<private> nodeVar317 : vec3<f32>;
var<private> nodeVar318 : vec3<f32>;
var<private> nodeVar319 : vec3<f32>;
var<private> nodeVar320 : vec3<f32>;
var<private> nodeVar321 : vec3<f32>;
var<private> nodeVar322 : vec3<f32>;
var<private> nodeVar323 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar324 : vec3<f32>;
var<private> nodeVar325 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar326 : vec3<f32>;
var<private> nodeVar327 : f32;
var<private> nodeVar328 : f32;
var<private> nodeVar329 : f32;
var<private> nodeVar330 : f32;
var<private> nodeVar331 : f32;
var<private> nodeVar332 : f32;
var<private> nodeVar333 : f32;
var<private> nodeVar334 : f32;
var<private> nodeVar335 : f32;
var<private> nodeVar336 : f32;
var<private> nodeVar337 : f32;
var<private> nodeVar338 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar339 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar340 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar341 : vec3<f32>;
var<private> nodeVar342 : f32;
var<private> nodeVar343 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 86.0 ) );
	nodeVar1 = length( nodeVar0 );
	nodeVar2 = ( nodeVar1 / 1.18 );
	nodeVar3 = floor( nodeVar2 );
	nodeVar4 = ( atan2( nodeVar0.y, nodeVar0.x ) / 6.283185307179586 );
	nodeVar5 = ( ( nodeVar3 + 0.5 ) * 1.18 );
	nodeVar6 = max( round( ( nodeVar5 * 3.9269908169872414 ) ), 6.0 );
	nodeVar7 = ( ( u32( ( nodeVar3 * 3.17 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = ( ( nodeVar4 * nodeVar6 ) + ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) );
	nodeVar10 = ( ( u32( ( ( nodeVar3 * 53.1 ) + tsl_mod_float( floor( nodeVar9 ), nodeVar6 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar11 = ( ( ( nodeVar10 >> ( ( nodeVar10 >> 28u ) + 4u ) ) ^ nodeVar10 ) * 277803737u );
	nodeVar12 = ( f32( ( ( nodeVar11 >> 22u ) ^ nodeVar11 ) ) * 2.3283064365386963e-10 );
	nodeVar13 = fract( ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar12 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar14 = ( nodeVar13.z * 64.0 );
	nodeVar15 = floor( nodeVar14 );
	nodeVar16 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar15, 8.0 ), floor( ( nodeVar15 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar13.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar17 = length( vec2<f32>( ( v_positionWorld.x - 134.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar18 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 98.0 ) ) );
	nodeVar19 = length( vec2<f32>( ( v_positionWorld.x - 110.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar20 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 74.0 ) ) );
	nodeVar21 = fract( ( ( v_positionWorld * vec3<f32>( 0.33 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar22 = ( nodeVar21.z * 64.0 );
	nodeVar23 = floor( nodeVar22 );
	nodeVar24 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar23, 8.0 ), floor( ( nodeVar23 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar21.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar25 = ( max( max( ( smoothstep( 12.8, 16.0, nodeVar1 ) * 0.85 ), ( max( max( max( max( 0.0, ( 1.0 - smoothstep( 0.9, 2.4, nodeVar17 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar18 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar19 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar20 ) ) ) * 0.7 ) ), ( ( 1.0 - smoothstep( 1.6, 3.0, nodeVar1 ) ) * 0.5 ) ) * mix( 0.7, 1.25, ( ( mix( nodeVar24.x, nodeVar24.y, ( nodeVar22 - nodeVar23 ) ) * 0.5 ) + 0.5 ) ) );
	nodeVar26 = ( smoothstep( 0.0, 0.5, ( ( mix( nodeVar16.x, nodeVar16.y, ( nodeVar14 - nodeVar15 ) ) + ( nodeVar25 * 0.9 ) ) - 0.15 ) ) * nodeVar25 );
	nodeVar27 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.16 ) ) + vec3<f32>( 2.2, 0.7, 6.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar28 = ( nodeVar27.z * 64.0 );
	nodeVar29 = floor( nodeVar28 );
	nodeVar30 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar29, 8.0 ), floor( ( nodeVar29 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar27.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar31 = ( ( ( ( ( ( 1.0 * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar17 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar18 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar19 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar20 ) ) * 0.42 ) ) ) * ( 1.0 - ( smoothstep( 14.6, 16.1, nodeVar1 ) * 0.48 ) ) ) * ( 1.0 - ( smoothstep( 0.34, 0.7, mix( nodeVar30.x, nodeVar30.y, ( nodeVar28 - nodeVar29 ) ) ) * 0.4 ) ) );
	nodeVar32 = ( ( u32( ( nodeVar12 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar33 = ( ( ( nodeVar32 >> ( ( nodeVar32 >> 28u ) + 4u ) ) ^ nodeVar32 ) * 277803737u );
	nodeVar34 = ( ( u32( nodeVar12 ) * 747796405u ) + 2891336453u );
	nodeVar35 = ( ( ( nodeVar34 >> ( ( nodeVar34 >> 28u ) + 4u ) ) ^ nodeVar34 ) * 277803737u );
	nodeVar36 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar12 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar37 = ( nodeVar36.z * 64.0 );
	nodeVar38 = floor( nodeVar37 );
	nodeVar39 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar38, 8.0 ), floor( ( nodeVar38 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar36.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar40 = ( ( mix( nodeVar39.x, nodeVar39.y, ( nodeVar37 - nodeVar38 ) ) * 0.5 ) + 0.5 );
	nodeVar41 = fract( ( ( v_positionWorld * vec3<f32>( 23.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar42 = ( nodeVar41.z * 64.0 );
	nodeVar43 = floor( nodeVar42 );
	nodeVar44 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar43, 8.0 ), floor( ( nodeVar43 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar41.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar45 = fract( nodeVar2 );
	nodeVar46 = fract( nodeVar9 );
	nodeVar47 = min( ( min( nodeVar45, ( 1.0 - nodeVar45 ) ) * 1.18 ), ( min( nodeVar46, ( 1.0 - nodeVar46 ) ) * ( ( nodeVar5 * 6.283185307179586 ) / nodeVar6 ) ) );
	nodeVar48 = ( fwidth( nodeVar47 ) + 0.0015 );
	nodeVar49 = ( 1.0 - smoothstep( 0.012, 0.05, nodeVar48 ) );
	nodeVar50 = ( mix( nodeVar44.x, nodeVar44.y, ( nodeVar42 - nodeVar43 ) ) * nodeVar49 );
	nodeVar51 = fract( ( ( ( v_positionWorld * vec3<f32>( 8.1 ) ) + vec3<f32>( nodeVar12 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar52 = ( nodeVar51.z * 64.0 );
	nodeVar53 = floor( nodeVar52 );
	nodeVar54 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar53, 8.0 ), floor( ( nodeVar53 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar51.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar55 = ( smoothstep( 0.52, 0.74, mix( nodeVar54.x, nodeVar54.y, ( nodeVar52 - nodeVar53 ) ) ) * nodeVar49 );
	nodeVar56 = fract( ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar57 = ( nodeVar56.z * 64.0 );
	nodeVar58 = floor( nodeVar57 );
	nodeVar59 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar58, 8.0 ), floor( ( nodeVar58 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar56.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar60 = fract( ( ( v_positionWorld * vec3<f32>( 31.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar61 = ( nodeVar60.z * 64.0 );
	nodeVar62 = floor( nodeVar61 );
	nodeVar63 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar62, 8.0 ), floor( ( nodeVar62 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar60.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar64 = ( ( nodeVar47 + ( mix( nodeVar59.x, nodeVar59.y, ( nodeVar57 - nodeVar58 ) ) * 0.014 ) ) + ( ( mix( nodeVar63.x, nodeVar63.y, ( nodeVar61 - nodeVar62 ) ) * 0.005 ) * nodeVar49 ) );
	nodeVar65 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar12 * 3.1 ) ) );
	nodeVar66 = fract( ( ( nodeVar65 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar67 = ( nodeVar66.z * 64.0 );
	nodeVar68 = floor( nodeVar67 );
	nodeVar69 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar68, 8.0 ), floor( ( nodeVar68 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar66.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar70 = fract( ( ( ( nodeVar65 * vec3<f32>( 2.9 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar71 = ( nodeVar70.z * 64.0 );
	nodeVar72 = floor( nodeVar71 );
	nodeVar73 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar72, 8.0 ), floor( ( nodeVar72 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar70.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar74 = fract( ( ( ( nodeVar65 * vec3<f32>( 2.9 ) ) + vec3<f32>( 13.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar75 = ( nodeVar74.z * 64.0 );
	nodeVar76 = floor( nodeVar75 );
	nodeVar77 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar76, 8.0 ), floor( ( nodeVar76 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar74.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar78 = ( vec3<f32>( mix( nodeVar69.x, nodeVar69.y, ( nodeVar67 - nodeVar68 ) ), mix( nodeVar73.x, nodeVar73.y, ( nodeVar71 - nodeVar72 ) ), mix( nodeVar77.x, nodeVar77.y, ( nodeVar75 - nodeVar76 ) ) ) * vec3<f32>( 0.4 ) );
	nodeVar79 = fract( ( ( nodeVar65 + nodeVar78 ) / vec3<f32>( 8.0 ) ) );
	nodeVar80 = ( nodeVar79.z * 64.0 );
	nodeVar81 = floor( nodeVar80 );
	nodeVar82 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar81, 8.0 ), floor( ( nodeVar81 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar79.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar83 = abs( mix( nodeVar82.x, nodeVar82.y, ( nodeVar80 - nodeVar81 ) ) );
	nodeVar84 = ( ( u32( ( nodeVar12 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar85 = ( ( ( nodeVar84 >> ( ( nodeVar84 >> 28u ) + 4u ) ) ^ nodeVar84 ) * 277803737u );
	nodeVar86 = ( ( u32( ( nodeVar12 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar87 = ( ( ( nodeVar86 >> ( ( nodeVar86 >> 28u ) + 4u ) ) ^ nodeVar86 ) * 277803737u );
	nodeVar88 = ( 0.02 + ( ( f32( ( ( nodeVar87 >> 22u ) ^ nodeVar87 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar89 = smoothstep( ( nodeVar88 - ( nodeVar48 * 0.9 ) ), ( nodeVar88 + ( nodeVar48 * 0.9 ) ), nodeVar64 );
	nodeVar90 = fract( ( ( ( ( v_positionWorld * vec3<f32>( 0.75 ) ) + ( nodeVar78 * vec3<f32>( 0.6 ) ) ) + vec3<f32>( 5.1, 1.3, 9.7 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar91 = ( nodeVar90.z * 64.0 );
	nodeVar92 = floor( nodeVar91 );
	nodeVar93 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar92, 8.0 ), floor( ( nodeVar92 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar90.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar94 = abs( mix( nodeVar93.x, nodeVar93.y, ( nodeVar91 - nodeVar92 ) ) );
	nodeVar95 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.13 ) ) + vec3<f32>( 1.9, 8.1, 3.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar96 = ( nodeVar95.z * 64.0 );
	nodeVar97 = floor( nodeVar96 );
	nodeVar98 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar97, 8.0 ), floor( ( nodeVar97 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar95.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar99 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar83 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar83 ) ) * step( 0.725, ( f32( ( ( nodeVar85 >> 22u ) ^ nodeVar85 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar89 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( nodeVar94 ) + 0.0015 ) * 1.6 ) ), nodeVar94 ) ) * 0.55 ) * smoothstep( 0.12, 0.4, mix( nodeVar98.x, nodeVar98.y, ( nodeVar96 - nodeVar97 ) ) ) ) * nodeVar89 ) );
	nodeVar100 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar33 >> 22u ) ^ nodeVar33 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar35 >> 22u ) ^ nodeVar35 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar40 ) ) ) * vec3<f32>( ( 1.0 + ( nodeVar50 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar55 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar64 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar64 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar64 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar99 * 0.78 ) ) ) );
	nodeVar101 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar26 * 0.9 ) ) * vec3<f32>( nodeVar31 ) ), ( ( mix( nodeVar100, ( nodeVar100 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar26 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar25 * 0.38 ) ) ) ) * vec3<f32>( nodeVar31 ) ), nodeVar89 );
	nodeVar102 = ( ( fwidth( nodeVar1 ) * 1.2 ) + 0.01 );
	nodeVar103 = mix( nodeVar101, ( nodeVar101 * vec3<f32>( 0.55 ) ), max( ( 1.0 - smoothstep( 0.07, ( 0.07 + nodeVar102 ), abs( ( nodeVar1 - 4.4 ) ) ) ), ( step( 0.84, fract( ( nodeVar4 * 36.0 ) ) ) * ( 1.0 - smoothstep( 0.16, ( nodeVar102 + 0.16 ), abs( ( nodeVar1 - 3.5 ) ) ) ) ) ) );
	DiffuseColor = vec4<f32>( nodeVar103, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar104 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar40 * 0.1 ) ) + ( nodeVar26 * 0.07 ) ), nodeVar89 ), 0.0525 ) + max( max( nodeVar104.x, nodeVar104.y ), nodeVar104.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	nodeVar105 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar106 = ( length( nodeVar105 ) / 4.4 );
	nodeVar107 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar108 = ( length( nodeVar107 ) / 4.4 );
	nodeVar109 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar110 = ( length( nodeVar109 ) / 4.4 );
	nodeVar111 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar112 = ( length( nodeVar111 ) / 4.4 );
	nodeVar113 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar114 = ( length( nodeVar113 ) / 4.4 );
	nodeVar115 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar116 = ( length( nodeVar115 ) / 4.4 );
	nodeVar117 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar118 = ( length( nodeVar117 ) / 4.4 );
	nodeVar119 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar120 = ( length( nodeVar119 ) / 4.4 );
	EmissiveColor = ( nodeVar103 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar106 * nodeVar106 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar105 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar108 * nodeVar108 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar107 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar110 * nodeVar110 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar109 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar112 * nodeVar112 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar111 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar114 * nodeVar114 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar113 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar116 * nodeVar116 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar115 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar118 * nodeVar118 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar117 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar120 * nodeVar120 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar119 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	nodeVar121 = dpdx( v_positionView );
	nodeVar122 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar123 = cross( nodeVar122, NORMAL_normalView );
	NORMAL_nodeVar124 = dot( nodeVar121, NORMAL_nodeVar123 );
	nodeVar125 = fract( ( ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( nodeVar12 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar126 = ( nodeVar125.z * 64.0 );
	nodeVar127 = floor( nodeVar126 );
	nodeVar128 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar127, 8.0 ), floor( ( nodeVar127 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar125.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar129 = ( ( ( ( ( nodeVar89 * 0.014 ) - ( nodeVar55 * 0.004 ) ) - ( nodeVar99 * 0.006 ) ) + ( nodeVar50 * 0.0018 ) ) + ( mix( nodeVar128.x, nodeVar128.y, ( nodeVar126 - nodeVar127 ) ) * 0.004 ) );
	nodeVar130 = ( vec3<f32>( sign( NORMAL_nodeVar124 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar129 ) ) * NORMAL_nodeVar123 ) + ( vec3<f32>( - dpdy( nodeVar129 ) ) * cross( NORMAL_normalView, nodeVar121 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar124 ) ) * NORMAL_normalView ) - nodeVar130 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar131 = dot( normalView, positionViewDirection );
	nodeVar132 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar131, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar132;
	nodeVar133 = ( dfg.x + dfg.y );
	nodeVar134 = ( 1.0 / nodeVar133 );
	nodeVar135 = nodeVar134;
	nodeVar136 = ( nodeVar135 - 1.0 );
	nodeVar137 = ( SpecularColorBlended * vec3<f32>( nodeVar136 ) );
	nodeVar138 = ( nodeVar137 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar138;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar139 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar140 = ( nodeVar139 * 0.5 );
	nodeVar141 = ( nodeVar140 + 0.5 );
	nodeVar142 = mix( render.nodeUniform8, render.nodeUniform9, nodeVar141 );
	nodeVar143 = ( irradiance + nodeVar142 );
	irradiance = nodeVar143;
	nodeVar144 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar145 = vec4<f32>( nodeVar144, 0.0 );
	nodeVar146 = ( render.cameraViewMatrix * nodeVar145 );
	nodeVar147 = normalize( nodeVar146.xyz );
	nodeVar148 = nodeVar147;
	nodeVar149 = dot( normalView, nodeVar148 );
	nodeVar150 = ( vec3<f32>( clamp( nodeVar149, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar151 = nodeVar150;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar152 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar153 = ( nodeVar151 * nodeVar152 );
	nodeVar154 = ( nodeVar148 + positionViewDirection );
	nodeVar155 = normalize( nodeVar154 );
	nodeVar156 = dot( positionViewDirection, nodeVar155 );
	nodeVar157 = clamp( nodeVar156, 0.0, 1.0 );
	nodeVar158 = exp2( ( ( ( nodeVar157 * -5.55473 ) - 6.98316 ) * nodeVar157 ) );
	nodeVar159 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar158 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar158 ) ) );
	nodeVar160 = ( vec3<f32>( 1.0 ) - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar153 * nodeVar161 );
	nodeVar163 = ( directDiffuse + nodeVar162 );
	directDiffuse = nodeVar163;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar164 = normalize( ( nodeVar148 + positionViewDirection ) );
	nodeVar165 = clamp( dot( positionViewDirection, nodeVar164 ), 0.0, 1.0 );
	nodeVar166 = exp2( ( ( ( nodeVar165 * -5.55473 ) - 6.98316 ) * nodeVar165 ) );
	nodeVar167 = ( Roughness * Roughness );
	nodeVar168 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar166 ) ) ) + vec3<f32>( ( 1.0 * nodeVar166 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar167, clamp( dot( normalView, nodeVar148 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar167, clamp( dot( normalView, nodeVar164 ), 0.0, 1.0 ) ) ) );
	nodeVar169 = ( nodeVar151 * nodeVar168 );
	nodeVar170 = ( nodeVar169 * multiScatteringCompensation );
	nodeVar171 = ( directSpecular + nodeVar170 );
	directSpecular = nodeVar171;
	nodeVar172 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar173 = vec4<f32>( nodeVar172, 0.0 );
	nodeVar174 = ( render.cameraViewMatrix * nodeVar173 );
	nodeVar175 = normalize( nodeVar174.xyz );
	nodeVar176 = nodeVar175;
	nodeVar177 = dot( normalView, nodeVar176 );
	shadowPositionWorld = v_positionWorld;
	nodeVar179 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar180 = ( nodeVar179.xyz / vec3<f32>( nodeVar179.w ) );
	nodeVar181 = vec3<f32>( nodeVar180.x, ( 1.0 - nodeVar180.y ), ( nodeVar180.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar181.x >= 0.0 ) && ( nodeVar181.x <= 1.0 ) ) && ( nodeVar181.y >= 0.0 ) ) && ( nodeVar181.y <= 1.0 ) ) && ( nodeVar181.z <= 1.0 ) ) ) {

		nodeVar182 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar183 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar184 = ( nodeVar181.xy + ( vogelDiskSample( 0, 5, nodeVar182 ) * vec2<f32>( nodeVar183 ) ) );
		nodeVar185 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar184, nodeVar181.z );
		nodeVar186 = ( nodeVar181.xy + ( vogelDiskSample( 1, 5, nodeVar182 ) * vec2<f32>( nodeVar183 ) ) );
		nodeVar187 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar186, nodeVar181.z );
		nodeVar188 = ( nodeVar181.xy + ( vogelDiskSample( 2, 5, nodeVar182 ) * vec2<f32>( nodeVar183 ) ) );
		nodeVar189 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar188, nodeVar181.z );
		nodeVar190 = ( nodeVar181.xy + ( vogelDiskSample( 3, 5, nodeVar182 ) * vec2<f32>( nodeVar183 ) ) );
		nodeVar191 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar190, nodeVar181.z );
		nodeVar192 = ( nodeVar181.xy + ( vogelDiskSample( 4, 5, nodeVar182 ) * vec2<f32>( nodeVar183 ) ) );
		nodeVar193 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar192, nodeVar181.z );
		nodeVar178 = ( ( ( ( ( nodeVar185 + nodeVar187 ) + nodeVar189 ) + nodeVar191 ) + nodeVar193 ) * 0.2 );

	} else {

		nodeVar178 = 1.0;

	}

	nodeVar194 = mix( 1.0, nodeVar178, render.nodeUniform24 );
	nodeVar195 = ( vec3<f32>( clamp( nodeVar177, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar194 ) ) );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar198 = ( nodeVar196 * nodeVar197 );
	nodeVar199 = ( nodeVar176 + positionViewDirection );
	nodeVar200 = normalize( nodeVar199 );
	nodeVar201 = dot( positionViewDirection, nodeVar200 );
	nodeVar202 = clamp( nodeVar201, 0.0, 1.0 );
	nodeVar203 = exp2( ( ( ( nodeVar202 * -5.55473 ) - 6.98316 ) * nodeVar202 ) );
	nodeVar204 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar203 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar203 ) ) );
	nodeVar205 = ( vec3<f32>( 1.0 ) - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( nodeVar198 * nodeVar206 );
	nodeVar208 = ( directDiffuse + nodeVar207 );
	directDiffuse = nodeVar208;
	nodeVar209 = normalize( ( nodeVar176 + positionViewDirection ) );
	nodeVar210 = clamp( dot( positionViewDirection, nodeVar209 ), 0.0, 1.0 );
	nodeVar211 = exp2( ( ( ( nodeVar210 * -5.55473 ) - 6.98316 ) * nodeVar210 ) );
	nodeVar212 = ( Roughness * Roughness );
	nodeVar213 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar211 ) ) ) + vec3<f32>( ( 1.0 * nodeVar211 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar212, clamp( dot( normalView, nodeVar176 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar212, clamp( dot( normalView, nodeVar209 ), 0.0, 1.0 ) ) ) );
	nodeVar214 = ( nodeVar196 * nodeVar213 );
	nodeVar215 = ( nodeVar214 * multiScatteringCompensation );
	nodeVar216 = ( directSpecular + nodeVar215 );
	directSpecular = nodeVar216;
	nodeVar217 = ( render.nodeUniform25 - v_positionView );
	nodeVar218 = normalize( nodeVar217 );
	nodeVar219 = dot( normalView, nodeVar218 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar221 = length( nodeVar217 );
		nodeVar222 = ( nodeVar221 / render.nodeUniform27 );
		nodeVar223 = clamp( ( 1.0 - ( ( ( nodeVar222 * nodeVar222 ) * nodeVar222 ) * nodeVar222 ) ), 0.0, 1.0 );
		nodeVar220 = ( ( 1.0 / max( pow( nodeVar221, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar223 * nodeVar223 ) );

	} else {

		nodeVar220 = ( 1.0 / max( pow( length( nodeVar217 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar224 = ( render.nodeUniform26 * vec3<f32>( nodeVar220 ) );
	nodeVar225 = ( vec3<f32>( clamp( nodeVar219, 0.0, 1.0 ) ) * nodeVar224 );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar228 = ( nodeVar226 * nodeVar227 );
	nodeVar229 = ( nodeVar218 + positionViewDirection );
	nodeVar230 = normalize( nodeVar229 );
	nodeVar231 = dot( positionViewDirection, nodeVar230 );
	nodeVar232 = clamp( nodeVar231, 0.0, 1.0 );
	nodeVar233 = exp2( ( ( ( nodeVar232 * -5.55473 ) - 6.98316 ) * nodeVar232 ) );
	nodeVar234 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar233 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar233 ) ) );
	nodeVar235 = ( vec3<f32>( 1.0 ) - nodeVar234 );
	nodeVar236 = nodeVar235;
	nodeVar237 = ( nodeVar228 * nodeVar236 );
	nodeVar238 = ( directDiffuse + nodeVar237 );
	directDiffuse = nodeVar238;
	nodeVar239 = normalize( ( nodeVar218 + positionViewDirection ) );
	nodeVar240 = clamp( dot( positionViewDirection, nodeVar239 ), 0.0, 1.0 );
	nodeVar241 = exp2( ( ( ( nodeVar240 * -5.55473 ) - 6.98316 ) * nodeVar240 ) );
	nodeVar242 = ( Roughness * Roughness );
	nodeVar243 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar241 ) ) ) + vec3<f32>( ( 1.0 * nodeVar241 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar242, clamp( dot( normalView, nodeVar218 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar242, clamp( dot( normalView, nodeVar239 ), 0.0, 1.0 ) ) ) );
	nodeVar244 = ( nodeVar226 * nodeVar243 );
	nodeVar245 = ( nodeVar244 * multiScatteringCompensation );
	nodeVar246 = ( directSpecular + nodeVar245 );
	directSpecular = nodeVar246;
	nodeVar247 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar248 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar249 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar250 = ( SpecularF90 * dfg.y );
	nodeVar251 = ( nodeVar249 + vec3<f32>( nodeVar250 ) );
	nodeVar252 = ( nodeVar247 + nodeVar251 );
	nodeVar247 = nodeVar252;
	nodeVar253 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar254 = nodeVar253;
	nodeVar255 = ( nodeVar254 * vec3<f32>( 0.047619 ) );
	nodeVar256 = ( SpecularColor + nodeVar255 );
	nodeVar257 = ( nodeVar251 * nodeVar256 );
	nodeVar258 = ( dfg.x + dfg.y );
	nodeVar259 = ( 1.0 - nodeVar258 );
	nodeVar260 = nodeVar259;
	nodeVar261 = ( vec3<f32>( nodeVar260 ) * nodeVar256 );
	nodeVar262 = ( vec3<f32>( 1.0 ) - nodeVar261 );
	nodeVar263 = nodeVar262;
	nodeVar264 = ( nodeVar257 / nodeVar263 );
	nodeVar265 = ( nodeVar264 * vec3<f32>( nodeVar260 ) );
	nodeVar266 = ( nodeVar248 + nodeVar265 );
	nodeVar248 = nodeVar266;
	nodeVar267 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar268 = ( irradiance * nodeVar267 );
	nodeVar269 = ( nodeVar247 + nodeVar248 );
	nodeVar270 = ( vec3<f32>( 1.0 ) - nodeVar269 );
	nodeVar271 = nodeVar270;
	nodeVar272 = ( nodeVar268 * nodeVar271 );
	nodeVar273 = nodeVar272;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar274 = ( indirectDiffuse + nodeVar273 );
	indirectDiffuse = nodeVar274;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar275 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar276 = ( SpecularF90 * dfg.y );
	nodeVar277 = ( nodeVar275 + vec3<f32>( nodeVar276 ) );
	nodeVar278 = ( singleScatteringDielectric + nodeVar277 );
	singleScatteringDielectric = nodeVar278;
	nodeVar279 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar280 = nodeVar279;
	nodeVar281 = ( nodeVar280 * vec3<f32>( 0.047619 ) );
	nodeVar282 = ( SpecularColor + nodeVar281 );
	nodeVar283 = ( nodeVar277 * nodeVar282 );
	nodeVar284 = ( dfg.x + dfg.y );
	nodeVar285 = ( 1.0 - nodeVar284 );
	nodeVar286 = nodeVar285;
	nodeVar287 = ( vec3<f32>( nodeVar286 ) * nodeVar282 );
	nodeVar288 = ( vec3<f32>( 1.0 ) - nodeVar287 );
	nodeVar289 = nodeVar288;
	nodeVar290 = ( nodeVar283 / nodeVar289 );
	nodeVar291 = ( nodeVar290 * vec3<f32>( nodeVar286 ) );
	nodeVar292 = ( multiScatteringDielectric + nodeVar291 );
	multiScatteringDielectric = nodeVar292;
	nodeVar293 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar294 = ( SpecularF90 * dfg.y );
	nodeVar295 = ( nodeVar293 + vec3<f32>( nodeVar294 ) );
	nodeVar296 = ( singleScatteringMetallic + nodeVar295 );
	singleScatteringMetallic = nodeVar296;
	nodeVar297 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar298 = nodeVar297;
	nodeVar299 = ( nodeVar298 * vec3<f32>( 0.047619 ) );
	nodeVar300 = ( DiffuseColor.xyz + nodeVar299 );
	nodeVar301 = ( nodeVar295 * nodeVar300 );
	nodeVar302 = ( dfg.x + dfg.y );
	nodeVar303 = ( 1.0 - nodeVar302 );
	nodeVar304 = nodeVar303;
	nodeVar305 = ( vec3<f32>( nodeVar304 ) * nodeVar300 );
	nodeVar306 = ( vec3<f32>( 1.0 ) - nodeVar305 );
	nodeVar307 = nodeVar306;
	nodeVar308 = ( nodeVar301 / nodeVar307 );
	nodeVar309 = ( nodeVar308 * vec3<f32>( nodeVar304 ) );
	nodeVar310 = ( multiScatteringMetallic + nodeVar309 );
	multiScatteringMetallic = nodeVar310;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar311 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar312 = ( radiance * nodeVar311 );
	nodeVar313 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar314 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar315 = ( nodeVar313 * nodeVar314 );
	nodeVar316 = ( nodeVar312 + nodeVar315 );
	nodeVar317 = nodeVar316;
	nodeVar318 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar319 = ( vec3<f32>( 1.0 ) - nodeVar318 );
	nodeVar320 = nodeVar319;
	nodeVar321 = ( DiffuseContribution * nodeVar320 );
	nodeVar322 = ( nodeVar321 * nodeVar314 );
	nodeVar323 = nodeVar322;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar324 = ( indirectSpecular + nodeVar317 );
	indirectSpecular = nodeVar324;
	nodeVar325 = ( indirectDiffuse + nodeVar323 );
	indirectDiffuse = nodeVar325;
	ambientOcclusion = 1.0;
	nodeVar326 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar326;
	nodeVar327 = dot( normalView, positionViewDirection );
	nodeVar328 = ( clamp( nodeVar327, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar329 = ( Roughness * -16.0 );
	nodeVar330 = ( 1.0 - nodeVar329 );
	nodeVar331 = nodeVar330;
	nodeVar332 = ( - nodeVar331 );
	nodeVar333 = exp2( nodeVar332 );
	nodeVar334 = pow( nodeVar328, nodeVar333 );
	nodeVar335 = ( 1.0 - nodeVar334 );
	nodeVar336 = nodeVar335;
	nodeVar337 = ( ambientOcclusion - nodeVar336 );
	nodeVar338 = ( indirectSpecular * vec3<f32>( clamp( nodeVar337, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar338;
	nodeVar339 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar339;
	nodeVar340 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar340;
	nodeVar341 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar341;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar342 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar343 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar342 ) * nodeVar342 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar343;

	// result

	output.color = nodeVar343;

	return output;

}
