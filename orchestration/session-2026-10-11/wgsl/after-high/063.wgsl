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
@binding( 3 ) @group( 1 ) var nodeUniform11_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform11 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform24_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform24 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : f32,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform36 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : f32,
	nodeUniform31 : f32,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform21 : mat4x4<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : f32,
	nodeUniform27 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform26 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec2<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec2<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec2<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : vec2<f32>;
var<private> nodeVar17 : vec3<f32>;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec2<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : vec2<f32>;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : u32;
var<private> nodeVar29 : u32;
var<private> nodeVar30 : u32;
var<private> nodeVar31 : u32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : u32;
var<private> nodeVar37 : u32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : u32;
var<private> nodeVar43 : u32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : u32;
var<private> nodeVar50 : u32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec2<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec2<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : u32;
var<private> nodeVar69 : u32;
var<private> nodeVar70 : u32;
var<private> nodeVar71 : u32;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : u32;
var<private> nodeVar76 : u32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : u32;
var<private> nodeVar80 : u32;
var<private> nodeVar81 : u32;
var<private> nodeVar82 : u32;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar87 : vec3<f32>;
var<private> NORMAL_nodeVar88 : f32;
var<private> NORMAL_normalWorld : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : u32;
var<private> nodeVar94 : u32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : u32;
var<private> nodeVar100 : u32;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec2<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar105 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec2<f32>;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec4<f32>;
var<private> nodeVar121 : vec4<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec4<f32>;
var<private> nodeVar149 : vec4<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : vec4<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec2<f32>;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : vec2<f32>;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : vec2<f32>;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec2<f32>;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : vec2<f32>;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : f32;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : f32;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> nodeVar276 : vec3<f32>;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : f32;
var<private> nodeVar279 : f32;
var<private> nodeVar280 : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> nodeVar282 : vec3<f32>;
var<private> nodeVar283 : vec3<f32>;
var<private> nodeVar284 : vec3<f32>;
var<private> nodeVar285 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar286 : vec3<f32>;
var<private> nodeVar287 : vec3<f32>;
var<private> nodeVar288 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar289 : vec3<f32>;
var<private> nodeVar290 : vec3<f32>;
var<private> nodeVar291 : vec3<f32>;
var<private> nodeVar292 : vec3<f32>;
var<private> nodeVar293 : vec3<f32>;
var<private> nodeVar294 : vec3<f32>;
var<private> nodeVar295 : vec3<f32>;
var<private> nodeVar296 : vec3<f32>;
var<private> nodeVar297 : vec3<f32>;
var<private> nodeVar298 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar299 : vec3<f32>;
var<private> nodeVar300 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar301 : vec3<f32>;
var<private> nodeVar302 : f32;
var<private> nodeVar303 : f32;
var<private> nodeVar304 : f32;
var<private> nodeVar305 : f32;
var<private> nodeVar306 : f32;
var<private> nodeVar307 : f32;
var<private> nodeVar308 : f32;
var<private> nodeVar309 : f32;
var<private> nodeVar310 : f32;
var<private> nodeVar311 : f32;
var<private> nodeVar312 : f32;
var<private> nodeVar313 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar314 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar315 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar316 : vec3<f32>;
var<private> nodeVar317 : f32;
var<private> nodeVar318 : vec4<f32>;

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
	@location( 4 ) nodeVarying7 : f32,
	@location( 5 ) nodeVarying8 : f32,
	@location( 6 ) nodeVarying9 : f32,
	@location( 7 ) nodeVarying10 : vec4<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = fract( ( ( v_positionWorld * vec3<f32>( 0.55 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar1 = ( nodeVar0.z * 64.0 );
	nodeVar2 = floor( nodeVar1 );
	nodeVar3 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar2, 8.0 ), floor( ( nodeVar2 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar0.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar4 = fract( ( ( v_positionWorld * vec3<f32>( 2.6 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar5 = ( nodeVar4.z * 64.0 );
	nodeVar6 = floor( nodeVar5 );
	nodeVar7 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar6, 8.0 ), floor( ( nodeVar6 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar4.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar8 = fract( ( ( v_positionWorld * vec3<f32>( 11.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar9 = ( nodeVar8.z * 64.0 );
	nodeVar10 = floor( nodeVar9 );
	nodeVar11 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar10, 8.0 ), floor( ( nodeVar10 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar8.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar12 = ( ( ( 0.84 + ( mix( nodeVar3.x, nodeVar3.y, ( nodeVar1 - nodeVar2 ) ) * 0.26 ) ) + ( mix( nodeVar7.x, nodeVar7.y, ( nodeVar5 - nodeVar6 ) ) * 0.16 ) ) + ( mix( nodeVar11.x, nodeVar11.y, ( nodeVar9 - nodeVar10 ) ) * 0.1 ) );
	nodeVar13 = fract( ( ( v_positionWorld * vec3<f32>( 23.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar14 = ( nodeVar13.z * 64.0 );
	nodeVar15 = floor( nodeVar14 );
	nodeVar16 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar15, 8.0 ), floor( ( nodeVar15 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar13.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar17 = fract( ( ( v_positionWorld * vec3<f32>( 5.5 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar18 = ( nodeVar17.z * 64.0 );
	nodeVar19 = floor( nodeVar18 );
	nodeVar20 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar19, 8.0 ), floor( ( nodeVar19 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar17.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar21 = fract( ( ( v_positionWorld * vec3<f32>( 0.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar22 = ( nodeVar21.z * 64.0 );
	nodeVar23 = floor( nodeVar22 );
	nodeVar24 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar23, 8.0 ), floor( ( nodeVar23 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar21.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar25 = mix( nodeVar24.x, nodeVar24.y, ( nodeVar22 - nodeVar23 ) );
	nodeVar26 = ( ( ( ( v_positionWorld.y * 0.85 ) + ( nodeVar25 * 0.7 ) ) + ( v_positionWorld.x * 0.05 ) ) - ( v_positionWorld.z * 0.04 ) );
	nodeVar27 = floor( nodeVar26 );
	nodeVar28 = ( ( u32( ( nodeVar27 + 90.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar29 = ( ( ( nodeVar28 >> ( ( nodeVar28 >> 28u ) + 4u ) ) ^ nodeVar28 ) * 277803737u );
	nodeVar30 = ( ( u32( ( nodeVar27 + 91.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar31 = ( ( ( nodeVar30 >> ( ( nodeVar30 >> 28u ) + 4u ) ) ^ nodeVar30 ) * 277803737u );
	nodeVar32 = ( f32( ( ( nodeVar31 >> 22u ) ^ nodeVar31 ) ) * 2.3283064365386963e-10 );
	nodeVar33 = fwidth( nodeVar26 );
	nodeVar34 = min( max( ( nodeVar33 * 1.5 ), 0.16 ), 0.5 );
	nodeVar35 = fract( nodeVar26 );
	nodeVar36 = ( ( u32( ( nodeVar27 + 17.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar37 = ( ( ( nodeVar36 >> ( ( nodeVar36 >> 28u ) + 4u ) ) ^ nodeVar36 ) * 277803737u );
	nodeVar38 = ( f32( ( ( nodeVar37 >> 22u ) ^ nodeVar37 ) ) * 2.3283064365386963e-10 );
	nodeVar39 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar25 * 1.4 ) ) + ( nodeVar38 * 9.0 ) ) + ( ( nodeVar35 * ( nodeVar32 - 0.5 ) ) * 2.4 ) );
	nodeVar40 = ( ( nodeVar32 * 2.6 ) + 2.2 );
	nodeVar41 = ( nodeVar39 / nodeVar40 );
	nodeVar42 = ( ( u32( ( ( floor( nodeVar41 ) + ( nodeVar27 * 31.0 ) ) + 1000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar43 = ( ( ( nodeVar42 >> ( ( nodeVar42 >> 28u ) + 4u ) ) ^ nodeVar42 ) * 277803737u );
	nodeVar44 = max( 0.12, ( fwidth( nodeVar39 ) * 1.5 ) );
	nodeVar45 = fract( nodeVar41 );
	nodeVar46 = ( min( nodeVar45, ( 1.0 - nodeVar45 ) ) * nodeVar40 );
	nodeVar47 = ( smoothstep( 0.0, nodeVar34, nodeVar35 ) * smoothstep( 1.0, ( 1.0 - nodeVar34 ), nodeVar35 ) );
	nodeVar48 = mix( 0.5, ( f32( ( ( nodeVar43 >> 22u ) ^ nodeVar43 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar44, nodeVar46 ) * nodeVar47 ) );
	nodeVar49 = ( ( u32( ( nodeVar27 + 16.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar50 = ( ( ( nodeVar49 >> ( ( nodeVar49 >> 28u ) + 4u ) ) ^ nodeVar49 ) * 277803737u );
	nodeVar51 = mix( ( f32( ( ( nodeVar50 >> 22u ) ^ nodeVar50 ) ) * 2.3283064365386963e-10 ), nodeVar38, smoothstep( 0.0, nodeVar34, nodeVar35 ) );
	nodeVar52 = fract( ( ( v_positionWorld * vec3<f32>( 5.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar53 = ( nodeVar52.z * 64.0 );
	nodeVar54 = floor( nodeVar53 );
	nodeVar55 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar54, 8.0 ), floor( ( nodeVar54 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar52.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar56 = mix( nodeVar55.x, nodeVar55.y, ( nodeVar53 - nodeVar54 ) );
	nodeVar57 = fract( ( ( ( v_positionWorld * vec3<f32>( 1.7, 1.0, 1.7 ) ) + vec3<f32>( 7.1, 0.0, 3.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar58 = ( nodeVar57.z * 64.0 );
	nodeVar59 = floor( nodeVar58 );
	nodeVar60 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar59, 8.0 ), floor( ( nodeVar59 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar57.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar61 = smoothstep( 0.5, 1.0, ( 1.0 - abs( mix( nodeVar60.x, nodeVar60.y, ( nodeVar58 - nodeVar59 ) ) ) ) );
	nodeVar62 = fract( ( vec3<f32>( ( v_positionWorld.x * 1.6 ), ( v_positionWorld.y * 0.22 ), ( v_positionWorld.z * 1.6 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar63 = ( nodeVar62.z * 64.0 );
	nodeVar64 = floor( nodeVar63 );
	nodeVar65 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar64, 8.0 ), floor( ( nodeVar64 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar62.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar66 = max( 0.1, ( nodeVar33 * 1.5 ) );
	nodeVar67 = ( ( ( 1.0 - smoothstep( 0.02, nodeVar44, nodeVar46 ) ) * smoothstep( 0.3, 0.55, nodeVar38 ) ) * nodeVar47 );
	nodeVar68 = ( ( u32( ( nodeVar27 + 55.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar69 = ( ( ( nodeVar68 >> ( ( nodeVar68 >> 28u ) + 4u ) ) ^ nodeVar68 ) * 277803737u );
	nodeVar70 = ( ( u32( ( nodeVar27 + 44.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar71 = ( ( ( nodeVar70 >> ( ( nodeVar70 >> 28u ) + 4u ) ) ^ nodeVar70 ) * 277803737u );
	nodeVar72 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar25 * 0.35 ) ) + ( ( f32( ( ( nodeVar69 >> 22u ) ^ nodeVar69 ) ) * 2.3283064365386963e-10 ) * 13.0 ) ) + ( nodeVar35 * ( ( ( f32( ( ( nodeVar71 >> 22u ) ^ nodeVar71 ) ) * 2.3283064365386963e-10 ) - 0.5 ) * 0.6372 ) ) );
	nodeVar73 = fwidth( nodeVar72 );
	nodeVar74 = max( 0.025, ( nodeVar73 * 0.75 ) );
	nodeVar75 = ( ( u32( ( nodeVar27 + 33.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar76 = ( ( ( nodeVar75 >> ( ( nodeVar75 >> 28u ) + 4u ) ) ^ nodeVar75 ) * 277803737u );
	nodeVar77 = ( ( ( f32( ( ( nodeVar76 >> 22u ) ^ nodeVar76 ) ) * 2.3283064365386963e-10 ) * 2.0 ) + 1.3 );
	nodeVar78 = ( nodeVar72 / nodeVar77 );
	nodeVar79 = ( ( u32( ( nodeVar27 + 66.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar80 = ( ( ( nodeVar79 >> ( ( nodeVar79 >> 28u ) + 4u ) ) ^ nodeVar79 ) * 277803737u );
	nodeVar81 = ( ( u32( ( ( floor( nodeVar78 ) + ( nodeVar27 * 13.0 ) ) + 2000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar82 = ( ( ( nodeVar81 >> ( ( nodeVar81 >> 28u ) + 4u ) ) ^ nodeVar81 ) * 277803737u );
	nodeVar83 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar29 >> 22u ) ^ nodeVar29 ) ) * 2.3283064365386963e-10 ), nodeVar32, smoothstep( 0.0, nodeVar34, nodeVar35 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( nodeVar48 * 0.45 ) ) + ( nodeVar51 * 0.2 ) ) + ( nodeVar25 * 0.18 ) ) + ( nodeVar56 * 0.1 ) ) - ( ( 1.0 - nodeVar61 ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, mix( nodeVar65.x, nodeVar65.y, ( nodeVar63 - nodeVar64 ) ) ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar66, nodeVar35 ) * smoothstep( 1.0, ( 1.0 - nodeVar66 ), nodeVar35 ) ) ) * 0.35 ) ) * ( 1.0 - ( nodeVar67 * 0.4 ) ) ) * ( 1.0 - ( ( ( ( ( ( 1.0 - smoothstep( ( nodeVar74 - nodeVar73 ), ( nodeVar74 + nodeVar73 ), ( min( fract( nodeVar78 ), ( 1.0 - fract( nodeVar78 ) ) ) * nodeVar77 ) ) ) * min( 1.0, ( 0.05 / ( nodeVar73 * 1.5 ) ) ) ) * ( smoothstep( 0.35, 0.55, ( f32( ( ( nodeVar80 >> 22u ) ^ nodeVar80 ) ) * 2.3283064365386963e-10 ) ) * smoothstep( 0.4, 0.5, ( f32( ( ( nodeVar82 >> 22u ) ^ nodeVar82 ) ) * 2.3283064365386963e-10 ) ) ) ) * nodeVar47 ) * ( 1.0 - smoothstep( ( object.nodeUniform2 * 0.5 ), object.nodeUniform2, length( v_positionView ) ) ) ) * 0.45 ) ) ) ) );
	nodeVar84 = smoothstep( 0.2, 0.55, ( nodeVar25 + ( nodeVar56 * 0.5 ) ) );
	nodeVar85 = dpdx( v_positionView );
	nodeVar86 = - dpdy( v_positionView );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar87 = cross( nodeVar86, NORMAL_normalView );
	NORMAL_nodeVar88 = dot( nodeVar85, NORMAL_nodeVar87 );
	NORMAL_normalWorld = normalize( ( vec4<f32>( NORMAL_normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar89 = smoothstep( 0.93, 0.74, NORMAL_normalWorld.y );
	nodeVar90 = ( ( ( ( ( ( ( ( smoothstep( 0.0, 0.3, nodeVar35 ) * smoothstep( 1.0, 0.7, nodeVar35 ) ) * 0.13 ) + ( nodeVar51 * 0.2 ) ) + ( ( smoothstep( 0.0, 0.45, nodeVar46 ) * nodeVar47 ) * ( ( nodeVar48 * 0.14 ) + 0.06 ) ) ) - ( nodeVar67 * 0.09 ) ) + ( nodeVar61 * 0.12 ) ) + ( nodeVar56 * 0.025 ) ) * ( nodeVar89 * 0.6 ) );
	nodeVar91 = ( vec3<f32>( sign( NORMAL_nodeVar88 ) ) * ( ( vec3<f32>( dpdx( nodeVar90 ) ) * NORMAL_nodeVar87 ) + ( vec3<f32>( - dpdy( nodeVar90 ) ) * cross( NORMAL_normalView, nodeVar85 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar88 ) ) * NORMAL_normalView ) - nodeVar91 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar92 = floor( ( v_positionWorld.xz.y / 0.68 ) );
	nodeVar93 = ( ( u32( nodeVar92 ) * 747796405u ) + 2891336453u );
	nodeVar94 = ( ( ( nodeVar93 >> ( ( nodeVar93 >> 28u ) + 4u ) ) ^ nodeVar93 ) * 277803737u );
	nodeVar95 = ( v_positionWorld.xz.x + ( ( f32( ( ( nodeVar94 >> 22u ) ^ nodeVar94 ) ) * 2.3283064365386963e-10 ) * 1.15 ) );
	nodeVar96 = fract( ( nodeVar95 / 1.15 ) );
	nodeVar97 = fract( ( v_positionWorld.xz.y / 0.68 ) );
	nodeVar98 = min( ( min( nodeVar96, ( 1.0 - nodeVar96 ) ) * 1.15 ), ( min( nodeVar97, ( 1.0 - nodeVar97 ) ) * 0.68 ) );
	nodeVar99 = ( ( u32( ( floor( ( nodeVar95 / 1.15 ) ) + ( nodeVar92 * 57.0 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar100 = ( ( ( nodeVar99 >> ( ( nodeVar99 >> 28u ) + 4u ) ) ^ nodeVar99 ) * 277803737u );
	nodeVar101 = fract( ( ( v_positionWorld * vec3<f32>( 0.7 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar102 = ( nodeVar101.z * 64.0 );
	nodeVar103 = floor( nodeVar102 );
	nodeVar104 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar103, 8.0 ), floor( ( nodeVar103 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar101.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	DiffuseColor = ( vec4<f32>( mix( ( vec3<f32>( ( ( nodeVar12 * ( ( ( 1.0 - ( ( smoothstep( 0.25, 0.6, nodeVarying7 ) * ( 1.0 - smoothstep( 0.6, 0.95, nodeVarying7 ) ) ) * 0.22 ) ) + ( ( smoothstep( 0.35, 0.6, mix( nodeVar16.x, nodeVar16.y, ( nodeVar14 - nodeVar15 ) ) ) * nodeVarying7 ) * 0.45 ) ) - ( ( mix( nodeVar20.x, nodeVar20.y, ( nodeVar18 - nodeVar19 ) ) * nodeVarying7 ) * 0.12 ) ) ) * ( 1.0 - ( ( smoothstep( 0.0, 0.3, nodeVarying7 ) * ( 1.0 - smoothstep( 0.3, 0.6, nodeVarying7 ) ) ) * 0.12 ) ) ) ) * mix( vec3<f32>( 1.0, 1.0, 1.0 ), mix( mix( nodeVar83, ( ( nodeVar83 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( nodeVarying8 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar35 ) * smoothstep( 1.0, 0.9, nodeVar35 ) ) * nodeVar84 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar47 ) * 0.4 ) + ( ( nodeVarying8 * nodeVar84 ) * 0.12 ) ), 0.45 ) ), nodeVar89 ) ), ( vec3<f32>( ( ( ( mix( 0.55, 1.0, smoothstep( 0.012, 0.06, nodeVar98 ) ) * ( ( ( f32( ( ( nodeVar100 >> 22u ) ^ nodeVar100 ) ) * 2.3283064365386963e-10 ) * 0.55 ) + 0.7 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar98 ) * 0.18 ) + 0.82 ) ) * ( ( nodeVar12 * 0.5 ) + 0.5 ) ) ) * vec3<f32>( 1.0, 1.0, 1.0 ) ), ( nodeVarying9 * smoothstep( -0.5, 0.2, mix( nodeVar104.x, nodeVar104.y, ( nodeVar102 - nodeVar103 ) ) ) ) ), 1.0 ) * nodeVarying10 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform6 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	nodeVar105 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar105.x, nodeVar105.y ), nodeVar105.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	EmissiveColor = ( object.nodeUniform9 * vec3<f32>( object.nodeUniform10 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar106 = dot( normalView, positionViewDirection );
	nodeVar107 = textureSample( nodeUniform11, nodeUniform11_sampler, vec2<f32>( Roughness, clamp( nodeVar106, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar107;
	nodeVar108 = ( dfg.x + dfg.y );
	nodeVar109 = ( 1.0 / nodeVar108 );
	nodeVar110 = nodeVar109;
	nodeVar111 = ( nodeVar110 - 1.0 );
	nodeVar112 = ( SpecularColorBlended * vec3<f32>( nodeVar111 ) );
	nodeVar113 = ( nodeVar112 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar113;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar114 = dot( normalWorld, normalize( render.nodeUniform14 ) );
	nodeVar115 = ( nodeVar114 * 0.5 );
	nodeVar116 = ( nodeVar115 + 0.5 );
	nodeVar117 = mix( render.nodeUniform12, render.nodeUniform13, nodeVar116 );
	nodeVar118 = ( irradiance + nodeVar117 );
	irradiance = nodeVar118;
	nodeVar119 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar120 = vec4<f32>( nodeVar119, 0.0 );
	nodeVar121 = ( render.cameraViewMatrix * nodeVar120 );
	nodeVar122 = normalize( nodeVar121.xyz );
	nodeVar123 = nodeVar122;
	nodeVar124 = dot( normalView, nodeVar123 );
	nodeVar125 = ( vec3<f32>( clamp( nodeVar124, 0.0, 1.0 ) ) * render.nodeUniform17 );
	nodeVar126 = nodeVar125;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar127 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar128 = ( nodeVar126 * nodeVar127 );
	nodeVar129 = ( nodeVar123 + positionViewDirection );
	nodeVar130 = normalize( nodeVar129 );
	nodeVar131 = dot( positionViewDirection, nodeVar130 );
	nodeVar132 = clamp( nodeVar131, 0.0, 1.0 );
	nodeVar133 = exp2( ( ( ( nodeVar132 * -5.55473 ) - 6.98316 ) * nodeVar132 ) );
	nodeVar134 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar133 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar133 ) ) );
	nodeVar135 = ( vec3<f32>( 1.0 ) - nodeVar134 );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( nodeVar128 * nodeVar136 );
	nodeVar138 = ( directDiffuse + nodeVar137 );
	directDiffuse = nodeVar138;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar139 = normalize( ( nodeVar123 + positionViewDirection ) );
	nodeVar140 = clamp( dot( positionViewDirection, nodeVar139 ), 0.0, 1.0 );
	nodeVar141 = exp2( ( ( ( nodeVar140 * -5.55473 ) - 6.98316 ) * nodeVar140 ) );
	nodeVar142 = ( Roughness * Roughness );
	nodeVar143 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar141 ) ) ) + vec3<f32>( ( 1.0 * nodeVar141 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar142, clamp( dot( normalView, nodeVar123 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar142, clamp( dot( normalView, nodeVar139 ), 0.0, 1.0 ) ) ) );
	nodeVar144 = ( nodeVar126 * nodeVar143 );
	nodeVar145 = ( nodeVar144 * multiScatteringCompensation );
	nodeVar146 = ( directSpecular + nodeVar145 );
	directSpecular = nodeVar146;
	nodeVar147 = ( render.nodeUniform18 - render.nodeUniform19 );
	nodeVar148 = vec4<f32>( nodeVar147, 0.0 );
	nodeVar149 = ( render.cameraViewMatrix * nodeVar148 );
	nodeVar150 = normalize( nodeVar149.xyz );
	nodeVar151 = nodeVar150;
	nodeVar152 = dot( normalView, nodeVar151 );
	shadowPositionWorld = v_positionWorld;
	nodeVar154 = ( render.nodeUniform21 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform22 ) ) ), 1.0 ) );
	nodeVar155 = ( nodeVar154.xyz / vec3<f32>( nodeVar154.w ) );
	nodeVar156 = vec3<f32>( nodeVar155.x, ( 1.0 - nodeVar155.y ), ( nodeVar155.z + render.nodeUniform23 ) );

	if ( ( ( ( ( ( nodeVar156.x >= 0.0 ) && ( nodeVar156.x <= 1.0 ) ) && ( nodeVar156.y >= 0.0 ) ) && ( nodeVar156.y <= 1.0 ) ) && ( nodeVar156.z <= 1.0 ) ) ) {

		nodeVar157 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar158 = ( render.nodeUniform25 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform26 ).x );
		nodeVar159 = ( nodeVar156.xy + ( vogelDiskSample( 0, 5, nodeVar157 ) * vec2<f32>( nodeVar158 ) ) );
		nodeVar160 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar159, nodeVar156.z );
		nodeVar161 = ( nodeVar156.xy + ( vogelDiskSample( 1, 5, nodeVar157 ) * vec2<f32>( nodeVar158 ) ) );
		nodeVar162 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar161, nodeVar156.z );
		nodeVar163 = ( nodeVar156.xy + ( vogelDiskSample( 2, 5, nodeVar157 ) * vec2<f32>( nodeVar158 ) ) );
		nodeVar164 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar163, nodeVar156.z );
		nodeVar165 = ( nodeVar156.xy + ( vogelDiskSample( 3, 5, nodeVar157 ) * vec2<f32>( nodeVar158 ) ) );
		nodeVar166 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar165, nodeVar156.z );
		nodeVar167 = ( nodeVar156.xy + ( vogelDiskSample( 4, 5, nodeVar157 ) * vec2<f32>( nodeVar158 ) ) );
		nodeVar168 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar167, nodeVar156.z );
		nodeVar153 = ( ( ( ( ( nodeVar160 + nodeVar162 ) + nodeVar164 ) + nodeVar166 ) + nodeVar168 ) * 0.2 );

	} else {

		nodeVar153 = 1.0;

	}

	nodeVar169 = mix( 1.0, nodeVar153, render.nodeUniform27 );
	nodeVar170 = ( vec3<f32>( clamp( nodeVar152, 0.0, 1.0 ) ) * ( render.nodeUniform20 * vec3<f32>( nodeVar169 ) ) );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar173 = ( nodeVar171 * nodeVar172 );
	nodeVar174 = ( nodeVar151 + positionViewDirection );
	nodeVar175 = normalize( nodeVar174 );
	nodeVar176 = dot( positionViewDirection, nodeVar175 );
	nodeVar177 = clamp( nodeVar176, 0.0, 1.0 );
	nodeVar178 = exp2( ( ( ( nodeVar177 * -5.55473 ) - 6.98316 ) * nodeVar177 ) );
	nodeVar179 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar178 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar178 ) ) );
	nodeVar180 = ( vec3<f32>( 1.0 ) - nodeVar179 );
	nodeVar181 = nodeVar180;
	nodeVar182 = ( nodeVar173 * nodeVar181 );
	nodeVar183 = ( directDiffuse + nodeVar182 );
	directDiffuse = nodeVar183;
	nodeVar184 = normalize( ( nodeVar151 + positionViewDirection ) );
	nodeVar185 = clamp( dot( positionViewDirection, nodeVar184 ), 0.0, 1.0 );
	nodeVar186 = exp2( ( ( ( nodeVar185 * -5.55473 ) - 6.98316 ) * nodeVar185 ) );
	nodeVar187 = ( Roughness * Roughness );
	nodeVar188 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar186 ) ) ) + vec3<f32>( ( 1.0 * nodeVar186 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar187, clamp( dot( normalView, nodeVar151 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar187, clamp( dot( normalView, nodeVar184 ), 0.0, 1.0 ) ) ) );
	nodeVar189 = ( nodeVar171 * nodeVar188 );
	nodeVar190 = ( nodeVar189 * multiScatteringCompensation );
	nodeVar191 = ( directSpecular + nodeVar190 );
	directSpecular = nodeVar191;
	nodeVar192 = ( render.nodeUniform28 - v_positionView );
	nodeVar193 = normalize( nodeVar192 );
	nodeVar194 = dot( normalView, nodeVar193 );

	if ( ( render.nodeUniform30 > 0.0 ) ) {

		nodeVar196 = length( nodeVar192 );
		nodeVar197 = ( nodeVar196 / render.nodeUniform30 );
		nodeVar198 = clamp( ( 1.0 - ( ( ( nodeVar197 * nodeVar197 ) * nodeVar197 ) * nodeVar197 ) ), 0.0, 1.0 );
		nodeVar195 = ( ( 1.0 / max( pow( nodeVar196, render.nodeUniform31 ), 0.01 ) ) * ( nodeVar198 * nodeVar198 ) );

	} else {

		nodeVar195 = ( 1.0 / max( pow( length( nodeVar192 ), render.nodeUniform31 ), 0.01 ) );

	}

	nodeVar199 = ( render.nodeUniform29 * vec3<f32>( nodeVar195 ) );
	nodeVar200 = ( vec3<f32>( clamp( nodeVar194, 0.0, 1.0 ) ) * nodeVar199 );
	nodeVar201 = nodeVar200;
	nodeVar202 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar203 = ( nodeVar201 * nodeVar202 );
	nodeVar204 = ( nodeVar193 + positionViewDirection );
	nodeVar205 = normalize( nodeVar204 );
	nodeVar206 = dot( positionViewDirection, nodeVar205 );
	nodeVar207 = clamp( nodeVar206, 0.0, 1.0 );
	nodeVar208 = exp2( ( ( ( nodeVar207 * -5.55473 ) - 6.98316 ) * nodeVar207 ) );
	nodeVar209 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar208 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar208 ) ) );
	nodeVar210 = ( vec3<f32>( 1.0 ) - nodeVar209 );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( nodeVar203 * nodeVar211 );
	nodeVar213 = ( directDiffuse + nodeVar212 );
	directDiffuse = nodeVar213;
	nodeVar214 = normalize( ( nodeVar193 + positionViewDirection ) );
	nodeVar215 = clamp( dot( positionViewDirection, nodeVar214 ), 0.0, 1.0 );
	nodeVar216 = exp2( ( ( ( nodeVar215 * -5.55473 ) - 6.98316 ) * nodeVar215 ) );
	nodeVar217 = ( Roughness * Roughness );
	nodeVar218 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar216 ) ) ) + vec3<f32>( ( 1.0 * nodeVar216 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar217, clamp( dot( normalView, nodeVar193 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar217, clamp( dot( normalView, nodeVar214 ), 0.0, 1.0 ) ) ) );
	nodeVar219 = ( nodeVar201 * nodeVar218 );
	nodeVar220 = ( nodeVar219 * multiScatteringCompensation );
	nodeVar221 = ( directSpecular + nodeVar220 );
	directSpecular = nodeVar221;
	nodeVar222 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar223 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar224 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar225 = ( SpecularF90 * dfg.y );
	nodeVar226 = ( nodeVar224 + vec3<f32>( nodeVar225 ) );
	nodeVar227 = ( nodeVar222 + nodeVar226 );
	nodeVar222 = nodeVar227;
	nodeVar228 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( nodeVar229 * vec3<f32>( 0.047619 ) );
	nodeVar231 = ( SpecularColor + nodeVar230 );
	nodeVar232 = ( nodeVar226 * nodeVar231 );
	nodeVar233 = ( dfg.x + dfg.y );
	nodeVar234 = ( 1.0 - nodeVar233 );
	nodeVar235 = nodeVar234;
	nodeVar236 = ( vec3<f32>( nodeVar235 ) * nodeVar231 );
	nodeVar237 = ( vec3<f32>( 1.0 ) - nodeVar236 );
	nodeVar238 = nodeVar237;
	nodeVar239 = ( nodeVar232 / nodeVar238 );
	nodeVar240 = ( nodeVar239 * vec3<f32>( nodeVar235 ) );
	nodeVar241 = ( nodeVar223 + nodeVar240 );
	nodeVar223 = nodeVar241;
	nodeVar242 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar243 = ( irradiance * nodeVar242 );
	nodeVar244 = ( nodeVar222 + nodeVar223 );
	nodeVar245 = ( vec3<f32>( 1.0 ) - nodeVar244 );
	nodeVar246 = nodeVar245;
	nodeVar247 = ( nodeVar243 * nodeVar246 );
	nodeVar248 = nodeVar247;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar249 = ( indirectDiffuse + nodeVar248 );
	indirectDiffuse = nodeVar249;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar250 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar251 = ( SpecularF90 * dfg.y );
	nodeVar252 = ( nodeVar250 + vec3<f32>( nodeVar251 ) );
	nodeVar253 = ( singleScatteringDielectric + nodeVar252 );
	singleScatteringDielectric = nodeVar253;
	nodeVar254 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar255 = nodeVar254;
	nodeVar256 = ( nodeVar255 * vec3<f32>( 0.047619 ) );
	nodeVar257 = ( SpecularColor + nodeVar256 );
	nodeVar258 = ( nodeVar252 * nodeVar257 );
	nodeVar259 = ( dfg.x + dfg.y );
	nodeVar260 = ( 1.0 - nodeVar259 );
	nodeVar261 = nodeVar260;
	nodeVar262 = ( vec3<f32>( nodeVar261 ) * nodeVar257 );
	nodeVar263 = ( vec3<f32>( 1.0 ) - nodeVar262 );
	nodeVar264 = nodeVar263;
	nodeVar265 = ( nodeVar258 / nodeVar264 );
	nodeVar266 = ( nodeVar265 * vec3<f32>( nodeVar261 ) );
	nodeVar267 = ( multiScatteringDielectric + nodeVar266 );
	multiScatteringDielectric = nodeVar267;
	nodeVar268 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar269 = ( SpecularF90 * dfg.y );
	nodeVar270 = ( nodeVar268 + vec3<f32>( nodeVar269 ) );
	nodeVar271 = ( singleScatteringMetallic + nodeVar270 );
	singleScatteringMetallic = nodeVar271;
	nodeVar272 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar273 = nodeVar272;
	nodeVar274 = ( nodeVar273 * vec3<f32>( 0.047619 ) );
	nodeVar275 = ( DiffuseColor.xyz + nodeVar274 );
	nodeVar276 = ( nodeVar270 * nodeVar275 );
	nodeVar277 = ( dfg.x + dfg.y );
	nodeVar278 = ( 1.0 - nodeVar277 );
	nodeVar279 = nodeVar278;
	nodeVar280 = ( vec3<f32>( nodeVar279 ) * nodeVar275 );
	nodeVar281 = ( vec3<f32>( 1.0 ) - nodeVar280 );
	nodeVar282 = nodeVar281;
	nodeVar283 = ( nodeVar276 / nodeVar282 );
	nodeVar284 = ( nodeVar283 * vec3<f32>( nodeVar279 ) );
	nodeVar285 = ( multiScatteringMetallic + nodeVar284 );
	multiScatteringMetallic = nodeVar285;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar286 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar287 = ( radiance * nodeVar286 );
	nodeVar288 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar289 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar290 = ( nodeVar288 * nodeVar289 );
	nodeVar291 = ( nodeVar287 + nodeVar290 );
	nodeVar292 = nodeVar291;
	nodeVar293 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar294 = ( vec3<f32>( 1.0 ) - nodeVar293 );
	nodeVar295 = nodeVar294;
	nodeVar296 = ( DiffuseContribution * nodeVar295 );
	nodeVar297 = ( nodeVar296 * nodeVar289 );
	nodeVar298 = nodeVar297;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar299 = ( indirectSpecular + nodeVar292 );
	indirectSpecular = nodeVar299;
	nodeVar300 = ( indirectDiffuse + nodeVar298 );
	indirectDiffuse = nodeVar300;
	ambientOcclusion = 1.0;
	nodeVar301 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar301;
	nodeVar302 = dot( normalView, positionViewDirection );
	nodeVar303 = ( clamp( nodeVar302, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar304 = ( Roughness * -16.0 );
	nodeVar305 = ( 1.0 - nodeVar304 );
	nodeVar306 = nodeVar305;
	nodeVar307 = ( - nodeVar306 );
	nodeVar308 = exp2( nodeVar307 );
	nodeVar309 = pow( nodeVar303, nodeVar308 );
	nodeVar310 = ( 1.0 - nodeVar309 );
	nodeVar311 = nodeVar310;
	nodeVar312 = ( ambientOcclusion - nodeVar311 );
	nodeVar313 = ( indirectSpecular * vec3<f32>( clamp( nodeVar312, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar313;
	nodeVar314 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar314;
	nodeVar315 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar315;
	nodeVar316 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar316;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar317 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar318 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform32, object.nodeUniform33, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform35 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform36 * object.nodeUniform36 ) * nodeVar317 ) * nodeVar317 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar318;

	// result

	output.color = nodeVar318;

	return output;

}
